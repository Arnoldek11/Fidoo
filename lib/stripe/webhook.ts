import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";

function customerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

/**
 * Applies a verified Stripe event to the matching establishment.
 *
 * Billing state (plan/billingStatus) mirrors Stripe's own subscription
 * status rather than being independently derived — Stripe is the source of
 * truth here, unlike the app's own loyalty data which is always computed
 * from the immutable events log.
 */
export async function handleStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const establishmentId = session.client_reference_id ?? session.metadata?.establishmentId;
      const stripeCustomerId = customerId(session.customer);
      if (!establishmentId || !stripeCustomerId) break;

      await prisma.establishment.update({
        where: { id: establishmentId },
        data: {
          plan: "standard",
          billingStatus: "active",
          stripeCustomerId,
          stripeSubscriptionId:
            typeof session.subscription === "string" ? session.subscription : null,
        },
      });
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const stripeCustomerId = customerId(subscription.customer);
      if (!stripeCustomerId) break;

      await prisma.establishment.updateMany({
        where: { stripeCustomerId },
        data: {
          billingStatus: subscription.status,
          // Non-destructive on cancellation, same pattern as GDPR erasure:
          // the establishment and all its data are untouched, only the
          // plan reverts — never delete anything here.
          plan: subscription.status === "canceled" ? "pilote" : "standard",
        },
      });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const stripeCustomerId = customerId(invoice.customer);
      if (!stripeCustomerId) break;

      await prisma.establishment.updateMany({
        where: { stripeCustomerId },
        data: { billingStatus: "past_due" },
      });
      break;
    }

    default:
      break;
  }
}
