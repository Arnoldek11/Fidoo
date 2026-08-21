import { inngest } from "@/lib/inngest/client";
import { findWinbackTargets } from "@/lib/winback/detect";
import { sendWinbackCampaign } from "@/lib/winback/campaign";

// Each customer's send is its own named step so a mid-run failure/retry
// replays only the customers that hadn't succeeded yet — Inngest memoizes
// completed steps, so this can't double-send to someone already reached.
export const winbackNightly = inngest.createFunction(
  { id: "winback-nightly", triggers: { cron: "0 3 * * *" } },
  async ({ step }) => {
    const targets = await step.run("find-targets", () => findWinbackTargets());
    const campaignId = crypto.randomUUID();

    for (const target of targets) {
      await step.run(`send-${target.customerId}`, () =>
        sendWinbackCampaign(campaignId, target)
      );
    }

    return { campaignId, targeted: targets.length };
  }
);
