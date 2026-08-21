import type { ScopedTx } from "@/lib/db/scoped";

// If a return visit happens within this many days of a campaign_sent, it's
// credited to that campaign. Matches the cooldown in lib/winback/detect.ts
// so a customer is never mid-attribution-window and re-targeted at once.
export const ATTRIBUTION_WINDOW_DAYS = 14;

/**
 * Called right after a visit event is recorded. If the customer had a
 * campaign_sent within the attribution window, and that specific campaign
 * hasn't already been credited with a return, creates an attributed_return
 * event carrying the campaign's id and the establishment's average basket
 * (if configured) so the dashboard can turn it into a revenue estimate.
 * Returns null when there's nothing to attribute.
 */
export async function maybeAttributeReturn(
  tx: ScopedTx,
  establishmentId: string,
  customerId: string,
  visitCreatedAt: Date
) {
  const windowStart = new Date(
    visitCreatedAt.getTime() - ATTRIBUTION_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );

  const recentCampaign = await tx.event.findFirst({
    where: {
      customerId,
      type: "campaign_sent",
      createdAt: { gte: windowStart, lte: visitCreatedAt },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!recentCampaign) return null;

  const alreadyAttributed = await tx.event.findFirst({
    where: {
      customerId,
      type: "attributed_return",
      metadata: { path: ["campaignEventId"], equals: recentCampaign.id },
    },
  });
  if (alreadyAttributed) return null;

  const establishment = await tx.establishment.findUniqueOrThrow({
    where: { id: establishmentId },
  });

  const campaignMetadata = recentCampaign.metadata as { campaignId?: string };

  return tx.event.create({
    data: {
      establishmentId,
      customerId,
      type: "attributed_return",
      metadata: {
        campaignEventId: recentCampaign.id,
        campaignId: campaignMetadata.campaignId ?? null,
        averageBasketCents: establishment.averageBasketCents ?? null,
      },
    },
  });
}
