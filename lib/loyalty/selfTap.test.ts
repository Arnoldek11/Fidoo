import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { recordSelfTap, selfJoinAndTap, SELF_TAP_COOLDOWN_MS } from "@/lib/loyalty/selfTap";

describe("self tap (NFC/QR pod flow)", () => {
  let cafeA: { establishmentId: string; establishmentName: string };
  const createdCustomerIds: string[] = [];

  beforeAll(async () => {
    const a = await prisma.establishmentUser.findFirstOrThrow({
      where: { email: "cafe-a@test.fidoo.app" },
      include: { establishment: true },
    });
    cafeA = { establishmentId: a.establishmentId, establishmentName: a.establishment.name };
  });

  afterEach(async () => {
    for (const id of createdCustomerIds.splice(0)) {
      await prisma.customer.delete({ where: { id } }).catch(() => {});
    }
  });

  async function createTestCustomer(phone: string) {
    const customer = await prisma.customer.create({
      data: { establishmentId: cafeA.establishmentId, phone },
    });
    createdCustomerIds.push(customer.id);
    return customer;
  }

  it("returns not_found for an unknown customer id", async () => {
    const result = await recordSelfTap(
      cafeA.establishmentId,
      "00000000-0000-0000-0000-000000000000"
    );
    expect(result).toEqual({ status: "not_found" });
  });

  it("returns not_found when the customer belongs to a different establishment", async () => {
    const customer = await createTestCustomer("+32000000201");
    const result = await recordSelfTap("00000000-0000-0000-0000-000000000000", customer.id);
    expect(result.status).toBe("not_found");

    const events = await prisma.event.findMany({ where: { customerId: customer.id } });
    expect(events).toHaveLength(0);
  });

  it("records a visit + points pair tagged self_tap, with no staff attribution", async () => {
    const customer = await createTestCustomer("+32000000202");

    const result = await recordSelfTap(cafeA.establishmentId, customer.id);
    expect(result.status).toBe("stamped");
    if (result.status !== "stamped") return;
    expect(result.card.balance).toBe(1);
    expect(result.card.customerId).toBe(customer.id);
    expect(result.card.establishmentName).toBe(cafeA.establishmentName);

    const events = await prisma.event.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "asc" },
    });
    expect(events.map((e) => e.type).sort()).toEqual(["points_added", "visit"]);
    expect(events.every((e) => e.staffId === null)).toBe(true);
    expect(events.every((e) => (e.metadata as { source?: string }).source === "self_tap")).toBe(
      true
    );
  });

  it("blocks a second tap within the cooldown window and still returns the card", async () => {
    const customer = await createTestCustomer("+32000000203");

    await recordSelfTap(cafeA.establishmentId, customer.id);
    const second = await recordSelfTap(cafeA.establishmentId, customer.id);

    expect(second.status).toBe("cooldown");
    if (second.status !== "cooldown") return;
    expect(second.card.balance).toBe(1);
    expect(second.retryAfter.getTime()).toBeGreaterThan(Date.now());

    const visits = await prisma.event.findMany({
      where: { customerId: customer.id, type: "visit" },
    });
    expect(visits).toHaveLength(1);
  });

  it("also respects a cooldown started by a STAFF-validated visit (one visit = one stamp)", async () => {
    const customer = await createTestCustomer("+32000000204");

    await prisma.event.create({
      data: {
        establishmentId: cafeA.establishmentId,
        customerId: customer.id,
        type: "visit",
        metadata: {},
      },
    });

    const result = await recordSelfTap(cafeA.establishmentId, customer.id);
    expect(result.status).toBe("cooldown");
  });

  it("allows a new tap once the cooldown window has passed", async () => {
    const customer = await createTestCustomer("+32000000205");

    await prisma.event.create({
      data: {
        establishmentId: cafeA.establishmentId,
        customerId: customer.id,
        type: "visit",
        metadata: { source: "self_tap" },
        createdAt: new Date(Date.now() - SELF_TAP_COOLDOWN_MS - 1000),
      },
    });

    const result = await recordSelfTap(cafeA.establishmentId, customer.id);
    expect(result.status).toBe("stamped");

    const visits = await prisma.event.findMany({
      where: { customerId: customer.id, type: "visit" },
    });
    expect(visits).toHaveLength(2);
  });

  it("selfJoinAndTap creates the customer with consent recorded, then stamps", async () => {
    const phone = "+32000000206";

    const result = await selfJoinAndTap(cafeA.establishmentId, {
      phone,
      name: "Tap Tester",
      consent: true,
    });
    expect(result.status).toBe("stamped");
    if (result.status !== "stamped") return;
    createdCustomerIds.push(result.card.customerId);
    expect(result.card.balance).toBe(1);

    const customer = await prisma.customer.findUniqueOrThrow({
      where: { id: result.card.customerId },
    });
    expect(customer.name).toBe("Tap Tester");
    expect(customer.consentGivenAt).not.toBeNull();
    expect(customer.consentChannel).toBe("self_tap");
  });

  it("selfJoinAndTap without consent creates the customer with no consent fields", async () => {
    const result = await selfJoinAndTap(cafeA.establishmentId, {
      phone: "+32000000207",
      consent: false,
    });
    expect(result.status).toBe("stamped");
    if (result.status !== "stamped") return;
    createdCustomerIds.push(result.card.customerId);

    const customer = await prisma.customer.findUniqueOrThrow({
      where: { id: result.card.customerId },
    });
    expect(customer.consentGivenAt).toBeNull();
    expect(customer.consentChannel).toBeNull();
  });

  it("selfJoinAndTap with an existing phone reuses that customer and never overwrites them", async () => {
    const customer = await prisma.customer.create({
      data: {
        establishmentId: cafeA.establishmentId,
        phone: "+32000000208",
        name: "Original Name",
        consentGivenAt: new Date("2026-01-01"),
        consentChannel: "scan_form",
      },
    });
    createdCustomerIds.push(customer.id);

    const result = await selfJoinAndTap(cafeA.establishmentId, {
      phone: "+32000000208",
      name: "Impostor",
      consent: false,
    });
    expect(result.status).toBe("stamped");
    if (result.status !== "stamped") return;
    expect(result.card.customerId).toBe(customer.id);

    const unchanged = await prisma.customer.findUniqueOrThrow({ where: { id: customer.id } });
    expect(unchanged.name).toBe("Original Name");
    expect(unchanged.consentChannel).toBe("scan_form");

    const customers = await prisma.customer.findMany({
      where: { establishmentId: cafeA.establishmentId, phone: "+32000000208" },
    });
    expect(customers).toHaveLength(1);
  });

  it("selfJoinAndTap returns not_found for an unknown establishment", async () => {
    const result = await selfJoinAndTap("00000000-0000-0000-0000-000000000000", {
      phone: "+32000000209",
      consent: false,
    });
    expect(result).toEqual({ status: "not_found" });
  });
});
