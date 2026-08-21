import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/twilio/client";
import type { WinbackTarget } from "@/lib/winback/detect";

export function buildWinbackMessage(name: string | null): string {
  const greeting = name ? `${name}, ` : "";
  return `${greeting}ça fait un moment ! Revenez nous voir, votre carte de fidélité vous attend 😊`;
}

/**
 * Sends the SMS and records the campaign_sent event in the same call so a
 * send can never happen without being logged (or vice versa causing a
 * phantom "sent" that never went out) — not wrapped in a DB transaction
 * with the SMS API call since that's an external side effect, not
 * something a rollback could undo anyway.
 */
export async function sendWinbackCampaign(
  campaignId: string,
  target: WinbackTarget
) {
  const message = buildWinbackMessage(target.name);
  await sendSms(target.phone, message);

  return prisma.event.create({
    data: {
      establishmentId: target.establishmentId,
      customerId: target.customerId,
      type: "campaign_sent",
      metadata: { campaignId, message },
    },
  });
}
