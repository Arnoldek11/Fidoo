import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { RISK_THRESHOLD_DAYS } from "@/lib/loyalty/stats";
import { asEstablishmentUser } from "@/lib/db/scoped";

// Matches the attribution window (see lib/winback/attribution.ts) — don't
// re-target a customer while a previous campaign's return-window is still
// open, so one at-risk stretch doesn't generate repeat SMS.
export const CAMPAIGN_COOLDOWN_DAYS = 14;

export type WinbackTarget = {
  customerId: string;
  establishmentId: string;
  phone: string;
  name: string | null;
};

/**
 * System-level scan across ALL establishments — this is the nightly cron's
 * query, not a logged-in user's, so it deliberately does NOT go through
 * asEstablishmentUser/RLS. It's only ever invoked by the trusted Inngest
 * function, never reachable from user input.
 */
export async function findWinbackTargets(): Promise<WinbackTarget[]> {
  return prisma.$queryRaw<WinbackTarget[]>(Prisma.sql`
    SELECT
      c.id AS "customerId",
      c.establishment_id AS "establishmentId",
      c.phone,
      c.name
    FROM customers c
    LEFT JOIN LATERAL (
      SELECT MAX(created_at) AS last_visit_at FROM events e
      WHERE e.customer_id = c.id AND e.type = 'visit'
    ) last_visit ON true
    LEFT JOIN LATERAL (
      SELECT MAX(created_at) AS last_campaign_at FROM events e
      WHERE e.customer_id = c.id AND e.type = 'campaign_sent'
    ) last_campaign ON true
    WHERE c.consent_given_at IS NOT NULL
      AND last_visit.last_visit_at IS NOT NULL
      AND last_visit.last_visit_at < now() - make_interval(days => ${RISK_THRESHOLD_DAYS})
      AND (
        last_campaign.last_campaign_at IS NULL
        OR last_campaign.last_campaign_at < now() - make_interval(days => ${CAMPAIGN_COOLDOWN_DAYS})
      )
  `);
}

/**
 * Same eligibility rule as findWinbackTargets (consent given, past the risk
 * threshold, past cooldown), but scoped to one establishment via RLS — for
 * showing an owner "how many of your customers would this reach tonight",
 * not for the cron itself.
 */
export async function getWinbackEligibleCount(userId: string): Promise<number> {
  return asEstablishmentUser(userId, async (tx) => {
    const [row] = await tx.$queryRaw<{ count: number }[]>(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM customers c
      LEFT JOIN LATERAL (
        SELECT MAX(created_at) AS last_visit_at FROM events e
        WHERE e.customer_id = c.id AND e.type = 'visit'
      ) last_visit ON true
      LEFT JOIN LATERAL (
        SELECT MAX(created_at) AS last_campaign_at FROM events e
        WHERE e.customer_id = c.id AND e.type = 'campaign_sent'
      ) last_campaign ON true
      WHERE c.establishment_id = current_establishment_id()
        AND c.consent_given_at IS NOT NULL
        AND last_visit.last_visit_at IS NOT NULL
        AND last_visit.last_visit_at < now() - make_interval(days => ${RISK_THRESHOLD_DAYS})
        AND (
          last_campaign.last_campaign_at IS NULL
          OR last_campaign.last_campaign_at < now() - make_interval(days => ${CAMPAIGN_COOLDOWN_DAYS})
        )
    `);
    return row?.count ?? 0;
  });
}
