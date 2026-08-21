import { asEstablishmentUser } from "@/lib/db/scoped";

export const POINTS_PER_VISIT = 1;
export const DEFAULT_REDEMPTION_COST = 10;

/**
 * Records a visit as two immutable events: `visit` (attendance, used for
 * churn/win-back detection in Phase 5) and `points_added` (loyalty balance,
 * used for the wallet pass counter). Kept separate because they answer
 * different questions and may diverge later (e.g. points per euro spent
 * instead of per visit).
 */
export async function addVisit(userId: string, customerId: string) {
  return asEstablishmentUser(userId, async (tx) => {
    const establishmentUser = await tx.establishmentUser.findUniqueOrThrow({
      where: { id: userId },
    });

    const visit = await tx.event.create({
      data: {
        establishmentId: establishmentUser.establishmentId,
        customerId,
        type: "visit",
        metadata: {},
      },
    });

    const pointsAdded = await tx.event.create({
      data: {
        establishmentId: establishmentUser.establishmentId,
        customerId,
        type: "points_added",
        metadata: { points: POINTS_PER_VISIT },
      },
    });

    return { visit, pointsAdded };
  });
}

/**
 * Order-independent by construction: just reduces whatever events exist,
 * regardless of what order they were inserted in. Shared by both the
 * staff-scoped balance lookup and the public customer card, so the two
 * can never disagree on how a balance is derived.
 */
export function computeBalance(
  events: { type: string; metadata: unknown }[]
): number {
  return events.reduce((total, event) => {
    const metadata = event.metadata as { points?: number };
    if (event.type === "points_added") {
      return total + (metadata.points ?? POINTS_PER_VISIT);
    }
    if (event.type === "reward_redeemed") {
      return total - (metadata.points ?? DEFAULT_REDEMPTION_COST);
    }
    return total;
  }, 0);
}

/**
 * Balance is always computed from the event log, never stored — see
 * computeBalance for the order-independence guarantee.
 */
export async function getCustomerBalance(
  userId: string,
  customerId: string
): Promise<number> {
  return asEstablishmentUser(userId, async (tx) => {
    const events = await tx.event.findMany({
      where: { customerId, type: { in: ["points_added", "reward_redeemed"] } },
      select: { type: true, metadata: true },
    });

    return computeBalance(events);
  });
}
