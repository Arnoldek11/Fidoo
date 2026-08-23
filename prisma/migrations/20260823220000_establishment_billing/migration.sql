-- AlterTable: Stripe billing state for Phase 6.
-- billing_status mirrors Stripe's own subscription status string directly
-- (trialing/active/past_due/canceled/...) rather than a bespoke enum —
-- Stripe is the source of truth for billing state, so this is a straight
-- passthrough field, unlike loyalty data which is always derived from the
-- immutable events log.
ALTER TABLE "establishments" ADD COLUMN "billing_status" TEXT;
ALTER TABLE "establishments" ADD COLUMN "stripe_customer_id" TEXT;
ALTER TABLE "establishments" ADD COLUMN "stripe_subscription_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "establishments_stripe_customer_id_key" ON "establishments"("stripe_customer_id");
CREATE UNIQUE INDEX "establishments_stripe_subscription_id_key" ON "establishments"("stripe_subscription_id");

-- No new RLS policies needed: establishments already has RLS enabled and
-- FORCEd from an earlier migration, and Postgres row-level security applies
-- per-row regardless of which columns are selected/updated.
