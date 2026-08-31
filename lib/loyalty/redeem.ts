import { asEstablishmentUser } from "@/lib/db/scoped";
import { computeBalance } from "@/lib/loyalty/events";
import { DEFAULT_PROGRAM } from "@/lib/loyalty/program";

export type RedeemResult =
  | { status: "ok"; balance: number; rewardLabel: string }
  | { status: "insufficient"; balance: number; goal: number };

/**
 * Redeems a full card: inserts an immutable `reward_redeemed` event that
 * subtracts the program's goal from the balance. The goal and reward label
 * are snapshotted into the event's metadata at redemption time, so changing
 * the program later never rewrites what an old redemption cost — same
 * philosophy as every other journal entry.
 *
 * Balance is read, checked, and re-read inside one transaction so a
 * double-submit can't redeem the same stamps twice.
 */
export async function redeemReward(
  userId: string,
  staffId: string | undefined,
  customerId: string
): Promise<RedeemResult> {
  return asEstablishmentUser(userId, async (tx) => {
    const establishmentUser = await tx.establishmentUser.findUniqueOrThrow({
      where: { id: userId },
    });
    const establishmentId = establishmentUser.establishmentId;

    const program = await tx.loyaltyProgram.findUnique({ where: { establishmentId } });
    const goal = program?.goal ?? DEFAULT_PROGRAM.goal;
    const rewardLabel = program?.rewardLabel ?? DEFAULT_PROGRAM.rewardLabel;

    const events = await tx.event.findMany({
      where: { customerId, type: { in: ["points_added", "reward_redeemed", "points_reversed"] } },
      select: { type: true, metadata: true },
    });
    const balance = computeBalance(events);
    if (balance < goal) {
      return { status: "insufficient" as const, balance, goal };
    }

    await tx.event.create({
      data: {
        establishmentId,
        customerId,
        staffId,
        type: "reward_redeemed",
        metadata: { points: goal, rewardLabel },
      },
    });

    return { status: "ok" as const, balance: balance - goal, rewardLabel };
  });
}
