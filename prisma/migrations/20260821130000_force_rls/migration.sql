-- Postgres does not apply RLS policies to a table's owner by default.
-- Our Prisma runtime connection uses the same owner role as migrations,
-- so without FORCE ROW LEVEL SECURITY, RLS would be silently bypassed
-- for every app query. This makes the policies actually binding.
ALTER TABLE "establishments" FORCE ROW LEVEL SECURITY;
ALTER TABLE "establishment_users" FORCE ROW LEVEL SECURITY;
