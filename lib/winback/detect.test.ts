import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { findWinbackTargets } from "@/lib/winback/detect";
import { RISK_THRESHOLD_DAYS } from "@/lib/loyalty/stats";

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

describe("findWinbackTargets", () => {
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

  async function createCustomer(opts: {
    phone: string;
    hasConsent: boolean;
    lastVisitDaysAgo: number;
    campaignSentDaysAgo?: number;
  }) {
    const customer = await prisma.customer.create({
      data: {
        establishmentId,
        phone: opts.phone,
        consentGivenAt: opts.hasConsent ? new Date() : null,
        consentChannel: opts.hasConsent ? "test" : null,
      },
    });
    customerId = customer.id;

    await prisma.event.create({
      data: {
        establishmentId,
        customerId: customer.id,
        type: "visit",
        metadata: {},
        createdAt: daysAgo(opts.lastVisitDaysAgo),
      },
    });

    if (opts.campaignSentDaysAgo !== undefined) {
      await prisma.event.create({
        data: {
          establishmentId,
          customerId: customer.id,
          type: "campaign_sent",
          metadata: {},
          createdAt: daysAgo(opts.campaignSentDaysAgo),
        },
      });
    }

    return customer;
  }

  it("targets a consenting customer inactive past the threshold", async () => {
    const customer = await createCustomer({
      phone: "+32DETECT001",
      hasConsent: true,
      lastVisitDaysAgo: RISK_THRESHOLD_DAYS + 1,
    });

    const targets = await findWinbackTargets();
    expect(targets.some((t) => t.customerId === customer.id)).toBe(true);
  });

  it("does not target a customer still within the active window", async () => {
    const customer = await createCustomer({
      phone: "+32DETECT002",
      hasConsent: true,
      lastVisitDaysAgo: RISK_THRESHOLD_DAYS - 1,
    });

    const targets = await findWinbackTargets();
    expect(targets.some((t) => t.customerId === customer.id)).toBe(false);
  });

  it("does not target a customer without consent, however inactive", async () => {
    const customer = await createCustomer({
      phone: "+32DETECT003",
      hasConsent: false,
      lastVisitDaysAgo: RISK_THRESHOLD_DAYS + 30,
    });

    const targets = await findWinbackTargets();
    expect(targets.some((t) => t.customerId === customer.id)).toBe(false);
  });

  it("does not re-target someone already messaged within the cooldown", async () => {
    const customer = await createCustomer({
      phone: "+32DETECT004",
      hasConsent: true,
      lastVisitDaysAgo: RISK_THRESHOLD_DAYS + 1,
      campaignSentDaysAgo: 5,
    });

    const targets = await findWinbackTargets();
    expect(targets.some((t) => t.customerId === customer.id)).toBe(false);
  });

  it("re-targets once the cooldown has fully elapsed", async () => {
    const customer = await createCustomer({
      phone: "+32DETECT005",
      hasConsent: true,
      lastVisitDaysAgo: RISK_THRESHOLD_DAYS + 1,
      campaignSentDaysAgo: 20,
    });

    const targets = await findWinbackTargets();
    expect(targets.some((t) => t.customerId === customer.id)).toBe(true);
  });
});
