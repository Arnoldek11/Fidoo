import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { addVisit } from "@/lib/loyalty/events";
import { ATTRIBUTION_WINDOW_DAYS } from "@/lib/winback/attribution";

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

describe("win-back attribution (via addVisit)", () => {
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

  async function createCustomerWithCampaign(campaignSentDaysAgo: number) {
    const customer = await prisma.customer.create({
      data: { establishmentId: cafeA.establishmentId, phone: "+32ATTR001" },
    });
    customerId = customer.id;

    await prisma.event.create({
      data: {
        establishmentId: cafeA.establishmentId,
        customerId: customer.id,
        type: "campaign_sent",
        metadata: { campaignId: "test-campaign" },
        createdAt: daysAgo(campaignSentDaysAgo),
      },
    });

    return customer;
  }

  it("attributes a return that lands within the window", async () => {
    const customer = await createCustomerWithCampaign(5);

    const { attributedReturn } = await addVisit(cafeA.userId, customer.id);

    expect(attributedReturn).not.toBeNull();
    expect(attributedReturn?.type).toBe("attributed_return");
  });

  it("does not attribute a return outside the window", async () => {
    const customer = await createCustomerWithCampaign(ATTRIBUTION_WINDOW_DAYS + 1);

    const { attributedReturn } = await addVisit(cafeA.userId, customer.id);

    expect(attributedReturn).toBeNull();
  });

  it("does not double-attribute the same campaign to a second return", async () => {
    const customer = await createCustomerWithCampaign(5);

    const first = await addVisit(cafeA.userId, customer.id);
    expect(first.attributedReturn).not.toBeNull();

    const second = await addVisit(cafeA.userId, customer.id);
    expect(second.attributedReturn).toBeNull();
  });
});
