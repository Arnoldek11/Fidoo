import { asEstablishmentUser } from "@/lib/db/scoped";
import { computeBalance } from "@/lib/loyalty/events";

export type ReverseLastVisitResult =
  | { status: "ok"; balance: number }
  | { status: "nothing_to_reverse" };

/**
 * Corrects a mistaken staff validation (wrong customer scanned, duplicate
 * tap that slipped past the cooldown, etc.) without ever editing or
 * deleting the original event — the ledger stays append-only. Owner-only:
 * reachable from the dashboard customer page, not the Staff PWA, since
 * letting any staff PIN reverse points is its own fraud vector.
 */
export async function reverseLastVisit(
  userId: string,
  customerId: string
): Promise<ReverseLastVisitResult> {
  return asEstablishmentUser(userId, async (tx) => {
    const lastPointsAdded = await tx.event.findFirst({
      where: { customerId, type: "points_added" },
      orderBy: { createdAt: "desc" },
    });
    if (!lastPointsAdded) return { status: "nothing_to_reverse" };

    const establishmentUser = await tx.establishmentUser.findUniqueOrThrow({
      where: { id: userId },
    });
    const metadata = lastPointsAdded.metadata as { points?: number };

    await tx.event.create({
      data: {
        establishmentId: establishmentUser.establishmentId,
        customerId,
        type: "points_reversed",
        metadata: { points: metadata.points ?? 1, reversedEventId: lastPointsAdded.id },
      },
    });

    // Computed in the same transaction (not via getCustomerBalance, which
    // opens its own asEstablishmentUser transaction) so it sees the
    // points_reversed row just written above, not a stale pre-commit read.
    const events = await tx.event.findMany({
      where: { customerId, type: { in: ["points_added", "reward_redeemed", "points_reversed"] } },
      select: { type: true, metadata: true },
    });
    return { status: "ok", balance: computeBalance(events) };
  });
}
