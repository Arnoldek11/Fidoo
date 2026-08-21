-- Prisma's own bookkeeping table is public by default, which exposes migration
-- names/timestamps through Supabase's PostgREST API to anyone with the anon key.
-- Enable RLS with no policies: blocks all PostgREST/anon access while leaving
-- Prisma itself (table owner, connects directly over Postgres, not RLS-forced)
-- fully able to read/write it for migrations.
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
