-- CreateTable
CREATE TABLE "staff_members" (
    "id" UUID NOT NULL,
    "establishment_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "pin_hash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_members_establishment_id_name_key" ON "staff_members"("establishment_id", "name");

-- CreateIndex
CREATE INDEX "staff_members_establishment_id_idx" ON "staff_members"("establishment_id");

-- AddForeignKey
ALTER TABLE "staff_members" ADD CONSTRAINT "staff_members_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row Level Security
ALTER TABLE "staff_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "staff_members" FORCE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own establishment's staff"
  ON "staff_members" FOR SELECT
  USING (establishment_id = public.current_establishment_id());

CREATE POLICY "Users can add staff to their own establishment"
  ON "staff_members" FOR INSERT
  WITH CHECK (establishment_id = public.current_establishment_id());

CREATE POLICY "Users can update their own establishment's staff"
  ON "staff_members" FOR UPDATE
  USING (establishment_id = public.current_establishment_id())
  WITH CHECK (establishment_id = public.current_establishment_id());

-- No DELETE policy: deactivate (active = false) instead of deleting, so
-- historical event attribution (events.staff_id) never dangles mid-shift.

-- AlterTable: attribute counter-validated events to a staff roster entry.
-- Nullable — most events (win-back SMS, self-service join, owner-run scans)
-- have no staff attribution and that's expected, not an error.
ALTER TABLE "events" ADD COLUMN "staff_id" UUID;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "events_staff_id_created_at_idx" ON "events"("staff_id", "created_at");
