import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { eraseCustomer } from "@/lib/customers/erasure";
import { getDashboardStats } from "@/lib/loyalty/stats";

describe("eraseCustomer (right to erasure)", () => {
  let cafeA: { userId: string; establishmentId: string };

  beforeAll(async () => {
    const a = await prisma.establishmentUser.findFirstOrThrow({
      where: { email: "cafe-a@test.fidoo.app" },
    });
    cafeA = { userId: a.id, establishmentId: a.establishmentId };
  });

  it("deletes the customer's personal data but keeps their events, anonymized", async () => {
    const customer = await prisma.customer.create({
      data: {
        establishmentId: cafeA.establishmentId,
        phone: "+32ERASE001",
        name: "À Effacer",
        consentGivenAt: new Date(),
        consentChannel: "test",
      },
    });
    const visit = await prisma.event.create({
      data: {
        establishmentId: cafeA.establishmentId,
        customerId: customer.id,
        type: "visit",
        metadata: {},
      },
    });

    await eraseCustomer(cafeA.userId, customer.id);

    const gone = await prisma.customer.findUnique({ where: { id: customer.id } });
    expect(gone).toBeNull();

    const survivingEvent = await prisma.event.findUnique({ where: { id: visit.id } });
    expect(survivingEvent).not.toBeNull();
    expect(survivingEvent!.customerId).toBeNull();
  });

  it("does not crash or create a hole in aggregate stats after erasure", async () => {
    const customer = await prisma.customer.create({
      data: { establishmentId: cafeA.establishmentId, phone: "+32ERASE002" },
    });
    await prisma.event.create({
      data: {
        establishmentId: cafeA.establishmentId,
        customerId: customer.id,
        type: "visit",
        metadata: {},
      },
    });

    const before = await getDashboardStats(cafeA.userId);
    await eraseCustomer(cafeA.userId, customer.id);
    const after = await getDashboardStats(cafeA.userId);

    // The visit event itself survives (anonymized), so the weekly visit
    // count is unaffected by erasing the customer who made it.
    expect(after.visitsThisWeek).toBe(before.visitsThisWeek);
    // But the customer entity is gone, so they no longer count as active.
    expect(after.activeCustomers).toBe(before.activeCustomers - 1);
  });

  it("logs the erasure in the audit trail", async () => {
    const customer = await prisma.customer.create({
      data: { establishmentId: cafeA.establishmentId, phone: "+32ERASE003" },
    });

    await eraseCustomer(cafeA.userId, customer.id);

    const entry = await prisma.auditLog.findFirst({
      where: { targetId: customer.id, action: "erased_customer" },
    });
    expect(entry).not.toBeNull();
    expect(entry!.actorUserId).toBe(cafeA.userId);
  });
});
