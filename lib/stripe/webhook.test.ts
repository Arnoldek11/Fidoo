import { describe, it, expect, beforeAll, afterEach } from "vitest";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { handleStripeEvent } from "@/lib/stripe/webhook";

function fakeEvent<T>(type: Stripe.Event["type"], object: T): Stripe.Event {
  return { type, data: { object } } as unknown as Stripe.Event;
}

describe("handleStripeEvent", () => {
  let establishmentId: string;
  const stripeCustomerId = "cus_test_webhook_001";

  beforeAll(async () => {
    const a = await prisma.establishmentUser.findFirstOrThrow({
      where: { email: "cafe-a@test.fidoo.app" },
    });
    establishmentId = a.establishmentId;
  });

  afterEach(async () => {
    // Reset to the pre-subscription state so tests don't leak into each other.
    await prisma.establishment.update({
      where: { id: establishmentId },
      data: { plan: "pilote", billingStatus: null, stripeCustomerId: null, stripeSubscriptionId: null },
    });
  });

  it("activates the establishment on checkout.session.completed", async () => {
    await handleStripeEvent(
      fakeEvent("checkout.session.completed", {
        client_reference_id: establishmentId,
        customer: stripeCustomerId,
        subscription: "sub_test_001",
      })
    );

    const establishment = await prisma.establishment.findUniqueOrThrow({
      where: { id: establishmentId },
    });
    expect(establishment.plan).toBe("standard");
    expect(establishment.billingStatus).toBe("active");
    expect(establishment.stripeCustomerId).toBe(stripeCustomerId);
    expect(establishment.stripeSubscriptionId).toBe("sub_test_001");
  });

  it("marks the establishment past_due on invoice.payment_failed without touching its plan", async () => {
    await prisma.establishment.update({
      where: { id: establishmentId },
      data: { plan: "standard", billingStatus: "active", stripeCustomerId },
    });

    await handleStripeEvent(
      fakeEvent("invoice.payment_failed", { customer: stripeCustomerId })
    );

    const establishment = await prisma.establishment.findUniqueOrThrow({
      where: { id: establishmentId },
    });
    expect(establishment.billingStatus).toBe("past_due");
    // A failed payment doesn't get demoted immediately — Stripe's own dunning
    // process drives that via a later customer.subscription.updated event.
    expect(establishment.plan).toBe("standard");
  });

  it("reverts the establishment to the pilote plan on subscription cancellation, without deleting anything", async () => {
    await prisma.establishment.update({
      where: { id: establishmentId },
      data: { plan: "standard", billingStatus: "active", stripeCustomerId },
    });

    await handleStripeEvent(
      fakeEvent("customer.subscription.deleted", {
        customer: stripeCustomerId,
        status: "canceled",
      })
    );

    const establishment = await prisma.establishment.findUniqueOrThrow({
      where: { id: establishmentId },
    });
    expect(establishment.plan).toBe("pilote");
    expect(establishment.billingStatus).toBe("canceled");
  });

  it("ignores event types it doesn't handle instead of throwing", async () => {
    await expect(
      handleStripeEvent(fakeEvent("customer.created", { id: "cus_irrelevant" }))
    ).resolves.toBeUndefined();
  });
});
