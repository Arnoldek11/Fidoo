import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { addVisit, getCustomerBalance } from "@/lib/loyalty/events";

describe("loyalty events", () => {
  let cafeA: { userId: string; establishmentId: string };
  let customerId: string | undefined;

  beforeAll(async () => {
    const a = await prisma.establishmentUser.findFirstOrThrow({
      where: { email: "cafe-a@test.fidoo.app" },
    });
    cafeA = { userId: a.id, establishmentId: a.establishmentId };
  });

  afterEach(async () => {
    if (customerId) {
      await prisma.customer.delete({ where: { id: customerId } }).catch(() => {});
      customerId = undefined;
    }
  });

  async function createTestCustomer(phone: string) {
    const customer = await prisma.customer.create({
      data: { establishmentId: cafeA.establishmentId, phone },
    });
    customerId = customer.id;
    return customer;
  }

  it("addVisit only ever inserts events, never mutates a stored balance", async () => {
    const customer = await createTestCustomer("+32000000001");

    await addVisit(cafeA.userId, customer.id);

    const events = await prisma.event.findMany({
      where: { customerId: customer.id },
    });
    expect(events.map((e) => e.type).sort()).toEqual(["points_added", "visit"]);
  });

  it("balance sums points regardless of the order events were inserted in", async () => {
    const customer = await createTestCustomer("+32000000002");
    const now = new Date();

    // Deliberately insert a later-dated event before an earlier-dated one,
    // and a redemption in between, to prove the reducer doesn't rely on
    // insertion order — only on aggregating whatever's in the table.
    await prisma.event.create({
      data: {
        establishmentId: cafeA.establishmentId,
        customerId: customer.id,
        type: "points_added",
        metadata: { points: 1 },
        createdAt: new Date(now.getTime() + 60_000),
      },
    });
    await prisma.event.create({
      data: {
        establishmentId: cafeA.establishmentId,
        customerId: customer.id,
        type: "reward_redeemed",
        metadata: { points: 10 },
        createdAt: now,
      },
    });
    await prisma.event.create({
      data: {
        establishmentId: cafeA.establishmentId,
        customerId: customer.id,
        type: "points_added",
        metadata: { points: 1 },
        createdAt: new Date(now.getTime() - 60_000),
      },
    });

    const balance = await getCustomerBalance(cafeA.userId, customer.id);
    expect(balance).toBe(1 + 1 - 10);
  });
});
