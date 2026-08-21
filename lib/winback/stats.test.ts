import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { getCampaignStats } from "@/lib/winback/stats";

describe("getCampaignStats", () => {
  let cafeA: { userId: string; establishmentId: string };
  let customerIds: string[] = [];

  beforeAll(async () => {
    const a = await prisma.establishmentUser.findFirstOrThrow({
      where: { email: "cafe-a@test.fidoo.app" },
    });
    cafeA = { userId: a.id, establishmentId: a.establishmentId };
  });

  afterEach(async () => {
    if (customerIds.length > 0) {
      await prisma.customer.deleteMany({ where: { id: { in: customerIds } } });
      customerIds = [];
    }
  });

  it("aggregates targeted/returned/revenue for one campaign", async () => {
    const campaignId = `test-campaign-${crypto.randomUUID()}`;

    const [c1, c2, c3] = await Promise.all([
      prisma.customer.create({
        data: { establishmentId: cafeA.establishmentId, phone: "+32STATS001" },
      }),
      prisma.customer.create({
        data: { establishmentId: cafeA.establishmentId, phone: "+32STATS002" },
      }),
      prisma.customer.create({
        data: { establishmentId: cafeA.establishmentId, phone: "+32STATS003" },
      }),
    ]);
    customerIds = [c1.id, c2.id, c3.id];

    // 3 customers targeted, only 2 returned
    await prisma.event.createMany({
      data: [c1, c2, c3].map((c) => ({
        establishmentId: cafeA.establishmentId,
        customerId: c.id,
        type: "campaign_sent",
        metadata: { campaignId },
      })),
    });

    await prisma.event.createMany({
      data: [
        {
          establishmentId: cafeA.establishmentId,
          customerId: c1.id,
          type: "attributed_return",
          metadata: { campaignId, averageBasketCents: 850 },
        },
        {
          establishmentId: cafeA.establishmentId,
          customerId: c2.id,
          type: "attributed_return",
          metadata: { campaignId, averageBasketCents: 850 },
        },
      ],
    });

    const stats = await getCampaignStats(cafeA.userId);
    const campaign = stats.find((s) => s.campaignId === campaignId);

    expect(campaign).toBeDefined();
    expect(campaign!.targeted).toBe(3);
    expect(campaign!.returned).toBe(2);
    expect(campaign!.revenueCents).toBe(1700);
  });
});
