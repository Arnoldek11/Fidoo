-- DropForeignKey
ALTER TABLE "events" DROP CONSTRAINT "events_customer_id_fkey";

-- AlterTable: right-to-erasure deletes the Customer row but keeps their
-- events (SET NULL, not CASCADE) so establishment-wide aggregates don't
-- develop holes just because one customer was forgotten.
ALTER TABLE "events" ALTER COLUMN "customer_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Customers had no DELETE policy yet (right to erasure needs one)
CREATE POLICY "Users can erase their own establishment's customers"
  ON "customers" FOR DELETE
  USING (establishment_id = public.current_establishment_id());

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "establishment_id" UUID NOT NULL,
    "actor_user_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_establishment_id_created_at_idx" ON "audit_logs"("establishment_id", "created_at");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row Level Security
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" FORCE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own establishment's audit log"
  ON "audit_logs" FOR SELECT
  USING (establishment_id = public.current_establishment_id());

CREATE POLICY "Users can write audit entries for their own establishment"
  ON "audit_logs" FOR INSERT
  WITH CHECK (establishment_id = public.current_establishment_id());

-- Immutable, same as events: no UPDATE/DELETE policy means RLS default-denies
-- both; REVOKE is defense-in-depth in case a policy is added carelessly later.
REVOKE UPDATE, DELETE ON "audit_logs" FROM "authenticated";
