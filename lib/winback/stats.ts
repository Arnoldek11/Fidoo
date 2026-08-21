import { asEstablishmentUser } from "@/lib/db/scoped";

export type CampaignStat = {
  campaignId: string;
  sentAt: Date;
  targeted: number;
  returned: number;
  revenueCents: number;
};

/**
 * Aggregates in JS rather than SQL since campaigns are grouped by a value
 * inside the events' JSON metadata, not a column — fine at pilot scale
 * (a handful of nightly campaigns, not millions of events). Revisit with a
 * SQL GROUP BY on the JSON path if campaign volume ever makes this slow.
 */
export async function getCampaignStats(userId: string): Promise<CampaignStat[]> {
  return asEstablishmentUser(userId, async (tx) => {
    const sent = await tx.event.findMany({
      where: { type: "campaign_sent" },
      select: { createdAt: true, metadata: true },
    });

    const byCampaign = new Map<string, { sentAt: Date; targeted: number }>();
    for (const event of sent) {
      const meta = event.metadata as { campaignId?: string };
      if (!meta.campaignId) continue;
      const existing = byCampaign.get(meta.campaignId);
      if (existing) {
        existing.targeted += 1;
        if (event.createdAt < existing.sentAt) existing.sentAt = event.createdAt;
      } else {
        byCampaign.set(meta.campaignId, { sentAt: event.createdAt, targeted: 1 });
      }
    }

    const returns = await tx.event.findMany({
      where: { type: "attributed_return" },
      select: { metadata: true },
    });

    const returnsByCampaign = new Map<string, { count: number; revenueCents: number }>();
    for (const event of returns) {
      const meta = event.metadata as {
        campaignId?: string;
        averageBasketCents?: number | null;
      };
      if (!meta.campaignId) continue;
      const existing = returnsByCampaign.get(meta.campaignId) ?? {
        count: 0,
        revenueCents: 0,
      };
      existing.count += 1;
      existing.revenueCents += meta.averageBasketCents ?? 0;
      returnsByCampaign.set(meta.campaignId, existing);
    }

    return Array.from(byCampaign.entries())
      .map(([campaignId, info]) => {
        const returnInfo = returnsByCampaign.get(campaignId) ?? {
          count: 0,
          revenueCents: 0,
        };
        return {
          campaignId,
          sentAt: info.sentAt,
          targeted: info.targeted,
          returned: returnInfo.count,
          revenueCents: returnInfo.revenueCents,
        };
      })
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
  });
}
