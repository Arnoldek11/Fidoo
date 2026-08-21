import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { asEstablishmentUser } from "@/lib/db/scoped";

// Relies on the two seeded test accounts (see prisma/seed.ts): Café A and
// Café B, each with one establishment_user whose id matches a real Supabase
// Auth user. This is the critical isolation guarantee from Phase 1 of the
// plan: a user authenticated as one establishment must never be able to read
// another establishment's rows, however the query is phrased.
describe("multi-tenant RLS isolation", () => {
  let cafeA: { userId: string; establishmentId: string };
  let cafeB: { userId: string; establishmentId: string };

  beforeAll(async () => {
    const [a, b] = await Promise.all([
      prisma.establishmentUser.findFirstOrThrow({
        where: { email: "cafe-a@test.fidoo.app" },
      }),
      prisma.establishmentUser.findFirstOrThrow({
        where: { email: "cafe-b@test.fidoo.app" },
      }),
    ]);
    cafeA = { userId: a.id, establishmentId: a.establishmentId };
    cafeB = { userId: b.id, establishmentId: b.establishmentId };
  });

  it("only lists the caller's own establishment", async () => {
    const rows = await asEstablishmentUser(cafeA.userId, (tx) =>
      tx.establishment.findMany()
    );
    expect(rows.map((r) => r.id)).toEqual([cafeA.establishmentId]);
  });

  it("cannot read the other establishment directly by id", async () => {
    const row = await asEstablishmentUser(cafeA.userId, (tx) =>
      tx.establishment.findUnique({ where: { id: cafeB.establishmentId } })
    );
    expect(row).toBeNull();
  });

  it("cannot see the other establishment's users", async () => {
    const rows = await asEstablishmentUser(cafeA.userId, (tx) =>
      tx.establishmentUser.findMany({
        where: { establishmentId: cafeB.establishmentId },
      })
    );
    expect(rows).toHaveLength(0);
  });

  it("isolation holds in both directions", async () => {
    const row = await asEstablishmentUser(cafeB.userId, (tx) =>
      tx.establishment.findUnique({ where: { id: cafeA.establishmentId } })
    );
    expect(row).toBeNull();
  });

  it("an unrecognized user sees nothing", async () => {
    const rows = await asEstablishmentUser(
      "00000000-0000-0000-0000-000000000000",
      (tx) => tx.establishment.findMany()
    );
    expect(rows).toHaveLength(0);
  });
});
