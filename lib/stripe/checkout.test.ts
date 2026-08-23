import { describe, it, expect } from "vitest";
import { buildCheckoutSessionParams, buildPortalSessionParams } from "@/lib/stripe/checkout";

describe("buildCheckoutSessionParams", () => {
  const base = {
    establishmentId: "est-1",
    stripeCustomerId: null as string | null,
    email: "owner@example.com",
    priceId: "price_123",
    successUrl: "https://fidoo.app/dashboard/settings?checkout=success",
    cancelUrl: "https://fidoo.app/dashboard/settings?checkout=cancelled",
  };

  it("uses customer_email for a first-time subscriber (no Stripe customer yet)", () => {
    const params = buildCheckoutSessionParams(base);
    expect(params.customer).toBeUndefined();
    expect(params.customer_email).toBe("owner@example.com");
  });

  it("reuses the existing Stripe customer instead of creating a duplicate", () => {
    const params = buildCheckoutSessionParams({ ...base, stripeCustomerId: "cus_existing" });
    expect(params.customer).toBe("cus_existing");
    expect(params.customer_email).toBeUndefined();
  });

  it("is a subscription checkout tied back to the establishment", () => {
    const params = buildCheckoutSessionParams(base);
    expect(params.mode).toBe("subscription");
    expect(params.client_reference_id).toBe("est-1");
    expect(params.line_items).toEqual([{ price: "price_123", quantity: 1 }]);
  });
});

describe("buildPortalSessionParams", () => {
  it("points the portal at the establishment's Stripe customer", () => {
    const params = buildPortalSessionParams({
      stripeCustomerId: "cus_abc",
      returnUrl: "https://fidoo.app/dashboard/settings",
    });
    expect(params).toEqual({
      customer: "cus_abc",
      return_url: "https://fidoo.app/dashboard/settings",
    });
  });
});
