"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { asEstablishmentUser } from "@/lib/db/scoped";
import { getStripeClient } from "@/lib/stripe/client";
import { buildCheckoutSessionParams, buildPortalSessionParams } from "@/lib/stripe/checkout";

async function getOrigin() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  return `${proto}://${host}`;
}

async function requireEstablishmentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const establishmentUser = await asEstablishmentUser(user.id, (tx) =>
    tx.establishmentUser.findUnique({
      where: { id: user.id },
      include: { establishment: true },
    })
  );
  if (!establishmentUser) redirect("/login?error=no-establishment");
  return establishmentUser;
}

export async function createCheckoutSession() {
  const establishmentUser = await requireEstablishmentUser();
  const priceId = process.env.STRIPE_STANDARD_PRICE_ID;
  if (!priceId) {
    throw new Error("STRIPE_STANDARD_PRICE_ID is not configured");
  }

  const origin = await getOrigin();
  const { establishment } = establishmentUser;
  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create(
    buildCheckoutSessionParams({
      establishmentId: establishment.id,
      stripeCustomerId: establishment.stripeCustomerId,
      email: establishmentUser.email,
      priceId,
      successUrl: `${origin}/dashboard/settings?checkout=success`,
      cancelUrl: `${origin}/dashboard/settings?checkout=cancelled`,
    })
  );

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL");
  }
  redirect(session.url);
}

export async function createPortalSession() {
  const establishmentUser = await requireEstablishmentUser();
  const { establishment } = establishmentUser;
  if (!establishment.stripeCustomerId) {
    throw new Error("No Stripe customer on file for this establishment");
  }

  const origin = await getOrigin();
  const stripe = getStripeClient();

  const session = await stripe.billingPortal.sessions.create(
    buildPortalSessionParams({
      stripeCustomerId: establishment.stripeCustomerId,
      returnUrl: `${origin}/dashboard/settings`,
    })
  );

  redirect(session.url);
}
