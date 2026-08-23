import type Stripe from "stripe";

export function buildCheckoutSessionParams({
  establishmentId,
  stripeCustomerId,
  email,
  priceId,
  successUrl,
  cancelUrl,
}: {
  establishmentId: string;
  stripeCustomerId: string | null;
  email: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}): Stripe.Checkout.SessionCreateParams {
  return {
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: establishmentId,
    success_url: successUrl,
    cancel_url: cancelUrl,
    ...(stripeCustomerId ? { customer: stripeCustomerId } : { customer_email: email }),
  };
}

export function buildPortalSessionParams({
  stripeCustomerId,
  returnUrl,
}: {
  stripeCustomerId: string;
  returnUrl: string;
}): Stripe.BillingPortal.SessionCreateParams {
  return { customer: stripeCustomerId, return_url: returnUrl };
}
