import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { getCustomerCard } from "@/lib/loyalty/publicCard";
import { DEFAULT_REDEMPTION_COST } from "@/lib/loyalty/events";

describe("getCustomerCard (public)", () => {
  let establishmentId: string;
  let customerId: string | undefined;

  beforeAll(async () => {
    const a = await prisma.establishmentUser.findFirstOrThrow({
      where: { email: "cafe-a@test.fidoo.app" },
    });
    establishmentId = a.establishmentId;
  });

  afterEach(async () => {
    if (customerId) {
      await prisma.customer.delete({ where: { id: customerId } }).catch(() => {});
      customerId = undefined;
    }
  });

  it("returns null for an id that doesn't exist", async () => {
    const card = await getCustomerCard("00000000-0000-0000-0000-000000000000");
    expect(card).toBeNull();
  });

  it("returns the customer's name, establishment, and computed balance", async () => {
    const customer = await prisma.customer.create({
      data: { establishmentId, phone: "+32CARDTEST1", name: "Jean" },
    });
    customerId = customer.id;

    await prisma.event.create({
      data: {
        establishmentId,
        customerId: customer.id,
        type: "points_added",
        metadata: { points: 1 },
      },
    });
    await prisma.event.create({
      data: {
        establishmentId,
        customerId: customer.id,
        type: "points_added",
        metadata: { points: 1 },
      },
    });

    const card = await getCustomerCard(customer.id);
    expect(card).toEqual({
      name: "Jean",
      establishmentName: "Café A",
      balance: 2,
      goal: DEFAULT_REDEMPTION_COST,
    });
  });
});
