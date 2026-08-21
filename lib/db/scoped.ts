import { prisma } from "@/lib/prisma";
import type { PrismaClient } from "@/lib/generated/prisma/client";

/**
 * Runs `callback` inside a transaction scoped to `userId`'s tenant via RLS.
 *
 * Two things have to be true for the RLS policies on establishments/
 * establishment_users to actually bind, not just decorate:
 *
 * 1. `auth.uid()` must resolve to `userId` — set via the `request.jwt.claims`
 *    GUC, since Prisma connects over raw Postgres (not PostgREST), so nothing
 *    sets that for us the way Supabase's own client does.
 * 2. The session must NOT be the `postgres` role, because Supabase grants it
 *    BYPASSRLS — which skips RLS entirely regardless of FORCE ROW LEVEL
 *    SECURITY. `SET LOCAL ROLE authenticated` (a role `postgres` is a member
 *    of, without BYPASSRLS) is what actually subjects the query to policies.
 *
 * Both are `LOCAL` to the transaction, so they never leak to other requests
 * sharing the connection pool.
 */
export async function asEstablishmentUser<T>(
  userId: string,
  callback: (tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SET LOCAL ROLE authenticated`;
    await tx.$executeRaw`SELECT set_config('request.jwt.claims', ${JSON.stringify({ sub: userId })}, true)`;
    return callback(tx);
  });
}
