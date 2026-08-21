import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { logAudit, getAuditLog } from "@/lib/audit/log";
import { asEstablishmentUser } from "@/lib/db/scoped";

describe("audit log", () => {
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

  it("records who viewed what", async () => {
    const fakeCustomerId = crypto.randomUUID();
    await logAudit(cafeA.userId, "viewed_customer", "customer", fakeCustomerId);

    const entries = await getAuditLog(cafeA.userId);
    expect(
      entries.some(
        (e) => e.targetId === fakeCustomerId && e.action === "viewed_customer"
      )
    ).toBe(true);
  });

  it("is immutable — no UPDATE or DELETE even for one's own establishment", async () => {
    const fakeCustomerId = crypto.randomUUID();
    const entry = await logAudit(
      cafeA.userId,
      "viewed_customer",
      "customer",
      fakeCustomerId
    );

    await expect(
      asEstablishmentUser(cafeA.userId, (tx) =>
        tx.auditLog.update({
          where: { id: entry.id },
          data: { action: "erased_customer" },
        })
      )
    ).rejects.toThrow();

    await expect(
      asEstablishmentUser(cafeA.userId, (tx) =>
        tx.auditLog.delete({ where: { id: entry.id } })
      )
    ).rejects.toThrow();
  });

  it("cannot be read across establishments", async () => {
    const fakeCustomerId = crypto.randomUUID();
    await logAudit(cafeB.userId, "viewed_customer", "customer", fakeCustomerId);

    const entriesAsA = await getAuditLog(cafeA.userId);
    expect(entriesAsA.some((e) => e.targetId === fakeCustomerId)).toBe(false);
  });
});
