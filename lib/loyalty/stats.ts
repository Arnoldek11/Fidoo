import { asEstablishmentUser, type ScopedTx } from "@/lib/db/scoped";
import { Prisma } from "@/lib/generated/prisma/client";
import { computeBalance } from "./events";

export const RISK_THRESHOLD_DAYS = 21;
export const PERIODS = [7, 30, 90] as const;
export type Period = (typeof PERIODS)[number];

// Neither has a dedicated field in the schema — both are simple, named
// heuristics computed from what's already tracked (visit count, signup
// date), not invented data. Kept as named constants so the thresholds are
// one place to tune, not magic numbers scattered through the query/UI.
export const VIP_VISIT_THRESHOLD = 10;
export const NEW_CUSTOMER_DAYS = 14;

export type CustomerStatus = "risk" | "vip" | "new" | "active";

/** Same classification used by the Clients list and a customer's own profile — one rule, not two. */
export function classifyCustomerStatus(row: {
  visit_count: number;
  last_visit_at: Date | null;
  created_at: Date;
}): CustomerStatus {
  const dayMs = 24 * 60 * 60 * 1000;
  const isRisk =
    !row.last_visit_at || (Date.now() - row.last_visit_at.getTime()) / dayMs >= RISK_THRESHOLD_DAYS;
  if (isRisk) return "risk";
  if (row.visit_count >= VIP_VISIT_THRESHOLD) return "vip";
  if ((Date.now() - row.created_at.getTime()) / dayMs <= NEW_CUSTOMER_DAYS) return "new";
  return "active";
}

export type DashboardStats = {
  activeCustomers: number;
  visitsThisWeek: number;
  atRiskCustomers: number;
};

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  return asEstablishmentUser(userId, async (tx) => {
    const [risk] = await tx.$queryRaw<{ active: number; at_risk: number }[]>(
      Prisma.sql`
        SELECT
          COUNT(*) FILTER (
            WHERE last_visit.last_visit_at >= now() - make_interval(days => ${RISK_THRESHOLD_DAYS})
          )::int AS active,
          COUNT(*) FILTER (
            WHERE last_visit.last_visit_at < now() - make_interval(days => ${RISK_THRESHOLD_DAYS})
          )::int AS at_risk
        FROM customers c
        LEFT JOIN LATERAL (
          SELECT MAX(created_at) AS last_visit_at FROM events e
          WHERE e.customer_id = c.id AND e.type = 'visit'
        ) last_visit ON true
        WHERE c.establishment_id = current_establishment_id()
      `
    );

    const [visits] = await tx.$queryRaw<{ count: number }[]>(
      Prisma.sql`
        SELECT COUNT(*)::int AS count FROM events
        WHERE establishment_id = current_establishment_id()
          AND type = 'visit'
          AND created_at >= now() - interval '7 days'
      `
    );

    return {
      activeCustomers: risk?.active ?? 0,
      atRiskCustomers: risk?.at_risk ?? 0,
      visitsThisWeek: visits?.count ?? 0,
    };
  });
}

export type CustomerListRow = {
  id: string;
  phone: string;
  name: string | null;
  visit_count: number;
  last_visit_at: Date | null;
  created_at: Date;
  points: number;
  // null when the establishment hasn't set an average basket — an
  // honest "unknown" rather than a fabricated 0€.
  estimated_spend_cents: number | null;
};

export type CustomerSort = "name" | "visits" | "lastVisit";
export type CustomerFilter = "all" | "vip" | "new" | "risk";

const SORT_CLAUSES: Record<CustomerSort, Prisma.Sql> = {
  name: Prisma.sql`name NULLS LAST, phone`,
  visits: Prisma.sql`visit_count DESC, last_visit_at DESC NULLS LAST`,
  lastVisit: Prisma.sql`last_visit_at DESC NULLS LAST`,
};

export async function getCustomerList(
  userId: string,
  opts: { sort?: CustomerSort; search?: string; filter?: CustomerFilter } = {}
): Promise<CustomerListRow[]> {
  const { sort = "lastVisit", search, filter = "all" } = opts;

  return asEstablishmentUser(userId, async (tx) => {
    const establishment = await tx.establishment.findFirst({
      select: { averageBasketCents: true },
    });

    const searchClause = search
      ? Prisma.sql`AND (name ILIKE ${`%${search}%`} OR phone ILIKE ${`%${search}%`})`
      : Prisma.empty;
    const vipClause =
      filter === "vip" ? Prisma.sql`AND visit_count >= ${VIP_VISIT_THRESHOLD}` : Prisma.empty;
    const newClause =
      filter === "new"
        ? Prisma.sql`AND created_at >= now() - make_interval(days => ${NEW_CUSTOMER_DAYS})`
        : Prisma.empty;
    const riskClause =
      filter === "risk"
        ? Prisma.sql`AND (last_visit_at IS NULL OR last_visit_at < now() - make_interval(days => ${RISK_THRESHOLD_DAYS}))`
        : Prisma.empty;

    const rows = await tx.$queryRaw<
      {
        id: string;
        phone: string;
        name: string | null;
        visit_count: number;
        last_visit_at: Date | null;
        created_at: Date;
      }[]
    >(
      Prisma.sql`
        WITH base AS (
          SELECT
            c.id, c.phone, c.name, c.created_at,
            COUNT(e.id) FILTER (WHERE e.type = 'visit')::int AS visit_count,
            MAX(e.created_at) FILTER (WHERE e.type = 'visit') AS last_visit_at
          FROM customers c
          LEFT JOIN events e ON e.customer_id = c.id
          WHERE c.establishment_id = current_establishment_id()
          GROUP BY c.id, c.phone, c.name, c.created_at
        )
        SELECT * FROM base
        WHERE true
          ${searchClause}
          ${vipClause}
          ${newClause}
          ${riskClause}
        ORDER BY ${SORT_CLAUSES[sort]}
      `
    );

    // One query for every points/reward event of the establishment, reduced
    // in JS with the same computeBalance used for the per-customer wallet
    // balance — avoids N+1 queries without re-deriving the balance formula
    // a second time in SQL.
    const balanceEvents = await tx.event.findMany({
      where: { type: { in: ["points_added", "reward_redeemed"] } },
      select: { customerId: true, type: true, metadata: true },
    });
    const eventsByCustomer = new Map<string, { type: string; metadata: unknown }[]>();
    for (const e of balanceEvents) {
      if (!e.customerId) continue;
      const list = eventsByCustomer.get(e.customerId) ?? [];
      list.push(e);
      eventsByCustomer.set(e.customerId, list);
    }

    return rows.map((r) => ({
      ...r,
      points: computeBalance(eventsByCustomer.get(r.id) ?? []),
      estimated_spend_cents:
        establishment?.averageBasketCents != null
          ? r.visit_count * establishment.averageBasketCents
          : null,
    }));
  });
}

export async function getCustomerHistory(userId: string, customerId: string) {
  return asEstablishmentUser(userId, async (tx) => {
    const customer = await tx.customer.findUnique({ where: { id: customerId } });
    if (!customer) return null;

    const events = await tx.event.findMany({
      where: { customerId },
      orderBy: { createdAt: "asc" },
    });

    const establishment = await tx.establishment.findFirst({
      select: { averageBasketCents: true },
    });

    const visitCount = events.filter((e) => e.type === "visit").length;
    const lastVisitAt =
      events.filter((e) => e.type === "visit").at(-1)?.createdAt ?? null;

    return {
      customer,
      events,
      visitCount,
      lastVisitAt,
      points: computeBalance(events),
      estimatedSpendCents:
        establishment?.averageBasketCents != null
          ? visitCount * establishment.averageBasketCents
          : null,
      status: classifyCustomerStatus({
        visit_count: visitCount,
        last_visit_at: lastVisitAt,
        created_at: customer.createdAt,
      }),
    };
  });
}

// --- Overview page (dashboard KPIs, activity chart, live feed) ---
//
// Distinct from getDashboardStats above: that one feeds win-back detection's
// active/at-risk split (lib/winback/detect.ts depends on its exact shape).
// This is period-scoped marketing KPIs for the redesigned "Vue d'ensemble"
// page — same underlying events table, different question.

export type Kpi = { value: number; deltaPct: number | null };

export type OverviewStats = {
  period: Period;
  loyalCustomers: Kpi;
  visits: Kpi;
  rewardsRedeemed: Kpi;
  returnRate: Kpi; // percentage, 0-100
};

function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

async function periodEventCount(
  tx: ScopedTx,
  type: string,
  offsetDaysFrom: number,
  offsetDaysTo: number
): Promise<number> {
  const [row] = await tx.$queryRaw<{ count: number }[]>(
    Prisma.sql`
      SELECT COUNT(*)::int AS count FROM events
      WHERE establishment_id = current_establishment_id()
        AND type = ${type}
        AND created_at >= now() - make_interval(days => ${offsetDaysFrom})
        AND created_at <  now() - make_interval(days => ${offsetDaysTo})
    `
  );
  return row?.count ?? 0;
}

async function customerSnapshotAsOf(tx: ScopedTx, asOfOffsetDays: number) {
  const [row] = await tx.$queryRaw<{ loyal: number; returning: number; with_visit: number }[]>(
    Prisma.sql`
      WITH asof AS (SELECT now() - make_interval(days => ${asOfOffsetDays}) AS ts)
      SELECT
        COUNT(*) FILTER (
          WHERE last_visit.last_visit_at >= (SELECT ts FROM asof) - make_interval(days => ${RISK_THRESHOLD_DAYS})
        )::int AS loyal,
        COUNT(*) FILTER (WHERE visits.n >= 2)::int AS returning,
        COUNT(*) FILTER (WHERE visits.n >= 1)::int AS with_visit
      FROM customers c
      LEFT JOIN LATERAL (
        SELECT MAX(created_at) AS last_visit_at FROM events e
        WHERE e.customer_id = c.id AND e.type = 'visit' AND e.created_at <= (SELECT ts FROM asof)
      ) last_visit ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*) AS n FROM events e
        WHERE e.customer_id = c.id AND e.type = 'visit' AND e.created_at <= (SELECT ts FROM asof)
      ) visits ON true
      WHERE c.establishment_id = current_establishment_id()
        AND c.created_at <= (SELECT ts FROM asof)
    `
  );
  return {
    loyal: row?.loyal ?? 0,
    returning: row?.returning ?? 0,
    withVisit: row?.with_visit ?? 0,
  };
}

export async function getOverviewStats(userId: string, period: Period = 30): Promise<OverviewStats> {
  return asEstablishmentUser(userId, async (tx) => {
    // Sequential, not Promise.all: these share one interactive-transaction
    // connection, and concurrent queries on it aren't safe.
    const nowSnap = await customerSnapshotAsOf(tx, 0);
    const prevSnap = await customerSnapshotAsOf(tx, period);
    const visitsNow = await periodEventCount(tx, "visit", period, 0);
    const visitsPrev = await periodEventCount(tx, "visit", period * 2, period);
    const rewardsNow = await periodEventCount(tx, "reward_redeemed", period, 0);
    const rewardsPrev = await periodEventCount(tx, "reward_redeemed", period * 2, period);

    const returnRateNow = nowSnap.withVisit > 0 ? (nowSnap.returning / nowSnap.withVisit) * 100 : 0;
    const returnRatePrev = prevSnap.withVisit > 0 ? (prevSnap.returning / prevSnap.withVisit) * 100 : 0;

    return {
      period,
      loyalCustomers: { value: nowSnap.loyal, deltaPct: pctDelta(nowSnap.loyal, prevSnap.loyal) },
      visits: { value: visitsNow, deltaPct: pctDelta(visitsNow, visitsPrev) },
      rewardsRedeemed: { value: rewardsNow, deltaPct: pctDelta(rewardsNow, rewardsPrev) },
      returnRate: { value: returnRateNow, deltaPct: pctDelta(returnRateNow, returnRatePrev) },
    };
  });
}

export type ActivityPoint = {
  date: string; // YYYY-MM-DD
  visits: number;
  newCustomers: number;
  rewardsRedeemed: number;
};

export async function getActivitySeries(userId: string, period: Period): Promise<ActivityPoint[]> {
  return asEstablishmentUser(userId, async (tx) => {
    const rows = await tx.$queryRaw<
      { day: Date; visits: number; new_customers: number; rewards: number }[]
    >(
      Prisma.sql`
        WITH days AS (
          SELECT generate_series(
            date_trunc('day', now() - make_interval(days => ${period - 1})),
            date_trunc('day', now()),
            interval '1 day'
          ) AS day
        )
        SELECT
          d.day,
          (SELECT COUNT(*)::int FROM events e
            WHERE e.establishment_id = current_establishment_id()
              AND e.type = 'visit' AND date_trunc('day', e.created_at) = d.day) AS visits,
          (SELECT COUNT(*)::int FROM customers c
            WHERE c.establishment_id = current_establishment_id()
              AND date_trunc('day', c.created_at) = d.day) AS new_customers,
          (SELECT COUNT(*)::int FROM events e
            WHERE e.establishment_id = current_establishment_id()
              AND e.type = 'reward_redeemed' AND date_trunc('day', e.created_at) = d.day) AS rewards
        FROM days d
        ORDER BY d.day
      `
    );

    return rows.map((r) => ({
      date: r.day.toISOString().slice(0, 10),
      visits: r.visits,
      newCustomers: r.new_customers,
      rewardsRedeemed: r.rewards,
    }));
  });
}

export type ActivityFeedItem = {
  id: string;
  kind: "visit" | "points_added" | "reward_redeemed" | "new_customer";
  createdAt: Date;
  customerLabel: string;
  points: number | null;
};

export async function getRecentActivity(userId: string, limit = 8): Promise<ActivityFeedItem[]> {
  return asEstablishmentUser(userId, async (tx) => {
    // Sequential, not Promise.all: these share one interactive-transaction
    // connection, and concurrent queries on it aren't safe.
    const events = await tx.event.findMany({
      where: { type: { in: ["visit", "points_added", "reward_redeemed"] } },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { customer: { select: { name: true, phone: true } } },
    });
    const newCustomers = await tx.customer.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, name: true, phone: true, createdAt: true },
    });

    const eventItems: ActivityFeedItem[] = events.map((e) => {
      const metadata = e.metadata as { points?: number };
      return {
        id: e.id,
        kind: e.type as ActivityFeedItem["kind"],
        createdAt: e.createdAt,
        customerLabel: e.customer?.name ?? e.customer?.phone ?? "Client supprimé",
        points: metadata?.points ?? null,
      };
    });

    const customerItems: ActivityFeedItem[] = newCustomers.map((c) => ({
      id: c.id,
      kind: "new_customer",
      createdAt: c.createdAt,
      customerLabel: c.name ?? c.phone,
      points: null,
    }));

    return [...eventItems, ...customerItems]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  });
}
