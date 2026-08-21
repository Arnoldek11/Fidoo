import { asEstablishmentUser } from "@/lib/db/scoped";
import { Prisma } from "@/lib/generated/prisma/client";

export const RISK_THRESHOLD_DAYS = 21;

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
};

export type CustomerSort = "name" | "visits" | "lastVisit";

const SORT_CLAUSES: Record<CustomerSort, Prisma.Sql> = {
  name: Prisma.sql`c.name NULLS LAST, c.phone`,
  visits: Prisma.sql`visit_count DESC, last_visit_at DESC NULLS LAST`,
  lastVisit: Prisma.sql`last_visit_at DESC NULLS LAST`,
};

export async function getCustomerList(
  userId: string,
  sort: CustomerSort = "lastVisit"
): Promise<CustomerListRow[]> {
  return asEstablishmentUser(userId, (tx) =>
    tx.$queryRaw<CustomerListRow[]>(
      Prisma.sql`
        SELECT
          c.id,
          c.phone,
          c.name,
          COUNT(e.id) FILTER (WHERE e.type = 'visit')::int AS visit_count,
          MAX(e.created_at) FILTER (WHERE e.type = 'visit') AS last_visit_at
        FROM customers c
        LEFT JOIN events e ON e.customer_id = c.id
        WHERE c.establishment_id = current_establishment_id()
        GROUP BY c.id, c.phone, c.name
        ORDER BY ${SORT_CLAUSES[sort]}
      `
    )
  );
}

export async function getCustomerHistory(userId: string, customerId: string) {
  return asEstablishmentUser(userId, async (tx) => {
    const customer = await tx.customer.findUnique({ where: { id: customerId } });
    if (!customer) return null;

    const events = await tx.event.findMany({
      where: { customerId },
      orderBy: { createdAt: "asc" },
    });

    return { customer, events };
  });
}
