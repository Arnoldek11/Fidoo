-- CreateTable: per-establishment loyalty card design + rules (see schema.prisma).
-- New table only — no existing table is touched by this migration.
CREATE TABLE "loyalty_programs" (
    "id" UUID NOT NULL,
    "establishment_id" UUID NOT NULL,
    "goal" INTEGER NOT NULL DEFAULT 10,
    "reward_label" TEXT NOT NULL DEFAULT 'récompense',
    "card_color" TEXT NOT NULL DEFAULT '#FF5A5F',
    "text_color" TEXT NOT NULL DEFAULT '#FFFFFF',
    "stamp_icon" TEXT NOT NULL DEFAULT 'coffee',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_programs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_programs_establishment_id_key" ON "loyalty_programs"("establishment_id");

-- AddForeignKey
ALTER TABLE "loyalty_programs" ADD CONSTRAINT "loyalty_programs_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row Level Security (same pattern as staff_members)
ALTER TABLE "loyalty_programs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "loyalty_programs" FORCE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own establishment's loyalty program"
  ON "loyalty_programs" FOR SELECT
  USING (establishment_id = public.current_establishment_id());

CREATE POLICY "Users can create their own establishment's loyalty program"
  ON "loyalty_programs" FOR INSERT
  WITH CHECK (establishment_id = public.current_establishment_id());

CREATE POLICY "Users can update their own establishment's loyalty program"
  ON "loyalty_programs" FOR UPDATE
  USING (establishment_id = public.current_establishment_id())
  WITH CHECK (establishment_id = public.current_establishment_id());

-- No DELETE policy: settings are edited, never removed — readers fall back
-- to defaults when the row is absent, and the FK cascade covers cleanup if
-- an establishment itself is ever deleted.
