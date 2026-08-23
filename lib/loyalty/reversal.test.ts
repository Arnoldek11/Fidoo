import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { addVisit, getCustomerBalance } from "@/lib/loyalty/events";
import { reverseLastVisit } from "@/lib/loyalty/reversal";

describe("reverseLastVisit", () => {
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

  it("subtracts the most recent points_added event via a new points_reversed event, not an edit", async () => {
    const customer = await createTestCustomer("+32000000201");
    await addVisit(cafeA.userId, customer.id);

    const result = await reverseLastVisit(cafeA.userId, customer.id);
    expect(result).toEqual({ status: "ok", balance: 0 });

    const events = await prisma.event.findMany({ where: { customerId: customer.id } });
    expect(events.map((e) => e.type).sort()).toEqual(["points_added", "points_reversed", "visit"]);
    // the original event is untouched — a reversal is a new row, never a mutation
    const original = events.find((e) => e.type === "points_added")!;
    expect(original.metadata).toEqual({ points: 1 });

    expect(await getCustomerBalance(cafeA.userId, customer.id)).toBe(0);
  });

  it("reports nothing_to_reverse for a customer with no points_added event", async () => {
    const customer = await createTestCustomer("+32000000202");
    const result = await reverseLastVisit(cafeA.userId, customer.id);
    expect(result).toEqual({ status: "nothing_to_reverse" });
  });
});
