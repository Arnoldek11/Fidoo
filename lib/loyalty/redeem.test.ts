import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { redeemReward } from "@/lib/loyalty/redeem";

describe("reward redemption", () => {
  let cafeA: { userId: string; establishmentId: string };
  const createdCustomerIds: string[] = [];

  beforeAll(async () => {
    const a = await prisma.establishmentUser.findFirstOrThrow({
      where: { email: "cafe-a@test.fidoo.app" },
    });
    cafeA = { userId: a.id, establishmentId: a.establishmentId };
    await prisma.loyaltyProgram.deleteMany({ where: { establishmentId: cafeA.establishmentId } });
  });

  afterEach(async () => {
    for (const id of createdCustomerIds.splice(0)) {
      await prisma.customer.delete({ where: { id } }).catch(() => {});
    }
  });

  afterAll(async () => {
    await prisma.loyaltyProgram.deleteMany({ where: { establishmentId: cafeA.establishmentId } });
  });

  async function createCustomerWithPoints(phone: string, points: number) {
    const customer = await prisma.customer.create({
      data: { establishmentId: cafeA.establishmentId, phone },
    });
    createdCustomerIds.push(customer.id);
    if (points > 0) {
      await prisma.event.create({
        data: {
          establishmentId: cafeA.establishmentId,
          customerId: customer.id,
          type: "points_added",
          metadata: { points },
        },
      });
    }
    return customer;
  }

  it("refuses when the balance is below the goal", async () => {
    const customer = await createCustomerWithPoints("+32000000301", 3);

    const result = await redeemReward(cafeA.userId, undefined, customer.id);
    expect(result).toEqual({ status: "insufficient", balance: 3, goal: 10 });

    const redemptions = await prisma.event.findMany({
      where: { customerId: customer.id, type: "reward_redeemed" },
    });
    expect(redemptions).toHaveLength(0);
  });

  it("redeems a full card, snapshotting goal + label into the event", async () => {
    const customer = await createCustomerWithPoints("+32000000302", 11);

    const staff = await prisma.staffMember.findFirst({
      where: { establishmentId: cafeA.establishmentId, active: true },
    });

    const result = await redeemReward(cafeA.userId, staff?.id, customer.id);
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.balance).toBe(1);

    const redemption = await prisma.event.findFirstOrThrow({
      where: { customerId: customer.id, type: "reward_redeemed" },
    });
    expect(redemption.metadata).toMatchObject({ points: 10, rewardLabel: "récompense" });
    if (staff) expect(redemption.staffId).toBe(staff.id);

    // A second redemption straight away must fail — the stamps are spent.
    const again = await redeemReward(cafeA.userId, undefined, customer.id);
    expect(again.status).toBe("insufficient");
  });

  it("uses the establishment's own program goal and label when configured", async () => {
    await prisma.loyaltyProgram.create({
      data: {
        establishmentId: cafeA.establishmentId,
        goal: 6,
        rewardLabel: "un dessert offert",
      },
    });
    const customer = await createCustomerWithPoints("+32000000303", 7);

    const result = await redeemReward(cafeA.userId, undefined, customer.id);
    expect(result).toEqual({ status: "ok", balance: 1, rewardLabel: "un dessert offert" });

    const redemption = await prisma.event.findFirstOrThrow({
      where: { customerId: customer.id, type: "reward_redeemed" },
    });
    expect(redemption.metadata).toMatchObject({ points: 6, rewardLabel: "un dessert offert" });
  });
});
