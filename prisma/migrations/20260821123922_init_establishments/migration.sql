-- CreateTable
CREATE TABLE "establishments" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'pilote',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "establishments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "establishment_users" (
    "id" UUID NOT NULL,
    "establishment_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'owner',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "establishment_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "establishment_users_establishment_id_email_key" ON "establishment_users"("establishment_id", "email");

-- AddForeignKey
ALTER TABLE "establishment_users" ADD CONSTRAINT "establishment_users_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "establishments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: establishment_users.id IS the Supabase Auth user id, not a separately generated one.
-- Deleting the auth user cascades to their establishment_users row.
ALTER TABLE "establishment_users" ADD CONSTRAINT "establishment_users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- Helper function: the establishment_id of the currently authenticated user.
-- SECURITY DEFINER + fixed search_path so it can read establishment_users regardless of
-- the calling user's RLS visibility, avoiding infinite recursion in the policies below.
CREATE OR REPLACE FUNCTION public.current_establishment_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT establishment_id FROM establishment_users WHERE id = auth.uid()
$$;

-- Row Level Security
ALTER TABLE "establishments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "establishment_users" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own establishment"
  ON "establishments" FOR SELECT
  USING (id = public.current_establishment_id());

CREATE POLICY "Users can view members of their own establishment"
  ON "establishment_users" FOR SELECT
  USING (establishment_id = public.current_establishment_id());
