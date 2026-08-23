import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { createStaffMember } from "@/lib/staff/roster";
import { recordStaffValidation, STAFF_VALIDATION_COOLDOWN_MS } from "@/lib/staff/validate";

describe("staff validation cooldown", () => {
  let cafeA: { userId: string; establishmentId: string };
  let staffId: string;
  let customerId: string | undefined;

  beforeAll(async () => {
    const a = await prisma.establishmentUser.findFirstOrThrow({
      where: { email: "cafe-a@test.fidoo.app" },
    });
    cafeA = { userId: a.id, establishmentId: a.establishmentId };

    const staff = await createStaffMember(cafeA.userId, { name: `Cooldown Tester ${Date.now()}`, pin: "9999" });
    if (staff.status !== "ok") throw new Error("setup failed");
    staffId = staff.id;
  });

  afterAll(async () => {
    await prisma.staffMember.delete({ where: { id: staffId } }).catch(() => {});
  });

  afterEach(async () => {
    if (customerId) {
      await prisma.customer.delete({ where: { id: customerId } }).catch(() => {});
      customerId = undefined;
    }
  });

  async function createTestCustomer(phone: string) {
    const customer = await prisma.customer.create({
      data: { establishmentId: cafeA.establishmentId, phone },
    });
    customerId = customer.id;
    return customer;
  }

  it("records a visit attributed to the staff member on first validation", async () => {
    const customer = await createTestCustomer("+32000000101");

    const result = await recordStaffValidation(cafeA.userId, staffId, customer.id);
    expect(result).toEqual({ status: "ok", customerId: customer.id, balance: 1 });

    const events = await prisma.event.findMany({ where: { customerId: customer.id } });
    expect(events.every((e) => e.staffId === staffId)).toBe(true);
  });

  it("blocks a second validation for the same customer within the cooldown window", async () => {
    const customer = await createTestCustomer("+32000000102");

    await recordStaffValidation(cafeA.userId, staffId, customer.id);
    const second = await recordStaffValidation(cafeA.userId, staffId, customer.id);

    expect(second.status).toBe("cooldown");

    const events = await prisma.event.findMany({ where: { customerId: customer.id, type: "visit" } });
    expect(events).toHaveLength(1);
  });

  it("allows a new validation once the cooldown window has passed", async () => {
    const customer = await createTestCustomer("+32000000103");

    await prisma.event.create({
      data: {
        establishmentId: cafeA.establishmentId,
        customerId: customer.id,
        staffId,
        type: "visit",
        metadata: {},
        createdAt: new Date(Date.now() - STAFF_VALIDATION_COOLDOWN_MS - 1000),
      },
    });

    const result = await recordStaffValidation(cafeA.userId, staffId, customer.id);
    expect(result.status).toBe("ok");

    const events = await prisma.event.findMany({ where: { customerId: customer.id, type: "visit" } });
    expect(events).toHaveLength(2);
  });
});
