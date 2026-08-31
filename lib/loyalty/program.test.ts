import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { asEstablishmentUser } from "@/lib/db/scoped";
import {
  DEFAULT_PROGRAM,
  getProgram,
  upsertProgram,
  getPublicProgram,
  programInputSchema,
} from "@/lib/loyalty/program";

const CUSTOM = {
  goal: 8,
  rewardLabel: "un café offert",
  cardColor: "#171717",
  textColor: "#FFFFFF",
  stampIcon: "croissant",
};

describe("loyalty program settings", () => {
  let cafeA: { userId: string; establishmentId: string };
  let cafeB: { userId: string; establishmentId: string };

  async function clearPrograms() {
    await prisma.loyaltyProgram.deleteMany({
      where: { establishmentId: { in: [cafeA.establishmentId, cafeB.establishmentId] } },
    });
  }

  beforeAll(async () => {
    const [a, b] = await Promise.all([
      prisma.establishmentUser.findFirstOrThrow({ where: { email: "cafe-a@test.fidoo.app" } }),
      prisma.establishmentUser.findFirstOrThrow({ where: { email: "cafe-b@test.fidoo.app" } }),
    ]);
    cafeA = { userId: a.id, establishmentId: a.establishmentId };
    cafeB = { userId: b.id, establishmentId: b.establishmentId };
    await clearPrograms();
  });

  afterAll(async () => {
    await clearPrograms();
  });

  it("returns the shared defaults when no program row exists", async () => {
    expect(await getProgram(cafeA.userId)).toEqual(DEFAULT_PROGRAM);
    expect(await getPublicProgram(cafeA.establishmentId)).toEqual(DEFAULT_PROGRAM);
  });

  it("upserts and reads back the owner's own settings, including publicly", async () => {
    const saved = await upsertProgram(cafeA.userId, CUSTOM);
    expect(saved).toEqual(CUSTOM);

    expect(await getProgram(cafeA.userId)).toEqual(CUSTOM);
    expect(await getPublicProgram(cafeA.establishmentId)).toEqual(CUSTOM);

    // Second upsert updates in place — still exactly one row.
    await upsertProgram(cafeA.userId, { ...CUSTOM, goal: 12 });
    const rows = await prisma.loyaltyProgram.findMany({
      where: { establishmentId: cafeA.establishmentId },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].goal).toBe(12);
  });

  it("RLS: another establishment can neither read nor update the row", async () => {
    const invisible = await asEstablishmentUser(cafeB.userId, (tx) =>
      tx.loyaltyProgram.findUnique({ where: { establishmentId: cafeA.establishmentId } })
    );
    expect(invisible).toBeNull();

    await expect(
      asEstablishmentUser(cafeB.userId, (tx) =>
        tx.loyaltyProgram.update({
          where: { establishmentId: cafeA.establishmentId },
          data: { goal: 4 },
        })
      )
    ).rejects.toThrow();

    // And B's own read still falls back to defaults, untouched by A's settings.
    expect(await getProgram(cafeB.userId)).toEqual(DEFAULT_PROGRAM);
  });

  it("input schema rejects bad colors, unknown icons and out-of-range goals", () => {
    expect(programInputSchema.safeParse(CUSTOM).success).toBe(true);
    expect(programInputSchema.safeParse({ ...CUSTOM, cardColor: "red" }).success).toBe(false);
    expect(programInputSchema.safeParse({ ...CUSTOM, stampIcon: "dragon" }).success).toBe(false);
    expect(programInputSchema.safeParse({ ...CUSTOM, goal: 3 }).success).toBe(false);
    expect(programInputSchema.safeParse({ ...CUSTOM, goal: 31 }).success).toBe(false);
    expect(programInputSchema.safeParse({ ...CUSTOM, rewardLabel: "" }).success).toBe(false);
  });
});
