-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "establishment_id" UUID NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "consent_given_at" TIMESTAMP(3),
    "consent_channel" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "establishment_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_establishment_id_phone_key" ON "customers"("establishment_id", "phone");

-- CreateIndex
CREATE INDEX "events_customer_id_created_at_idx" ON "events"("customer_id", "created_at");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row Level Security
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "customers" FORCE ROW LEVEL SECURITY;
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "events" FORCE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own establishment's customers"
  ON "customers" FOR SELECT
  USING (establishment_id = public.current_establishment_id());

CREATE POLICY "Users can register customers for their own establishment"
  ON "customers" FOR INSERT
  WITH CHECK (establishment_id = public.current_establishment_id());

CREATE POLICY "Users can view their own establishment's events"
  ON "events" FOR SELECT
  USING (establishment_id = public.current_establishment_id());

CREATE POLICY "Users can record events for their own establishment"
  ON "events" FOR INSERT
  WITH CHECK (establishment_id = public.current_establishment_id());

-- No UPDATE/DELETE policy on events: RLS default-denies both, so the journal
-- is immutable for the `authenticated` role even before the REVOKE below.
-- The REVOKE is defense-in-depth in case a future policy is added carelessly.
REVOKE UPDATE, DELETE ON "events" FROM "authenticated";
