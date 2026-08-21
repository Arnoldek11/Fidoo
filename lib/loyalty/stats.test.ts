import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  getDashboardStats,
  getCustomerList,
  RISK_THRESHOLD_DAYS,
} from "@/lib/loyalty/stats";

describe("dashboard stats", () => {
  let cafeA: { userId: string; establishmentId: string };
  let customerId: string | undefined;

  beforeAll(async () => {
    const a = await prisma.establishmentUser.findFirstOrThrow({
      where: { email: "cafe-a@test.fidoo.app" },
    });
    cafeA = { userId: a.id, establishmentId: a.establishmentId };
  });

  afterEach(async () => {
    if (customerId) {
      await prisma.customer.delete({ where: { id: customerId } }).catch(() => {});
      customerId = undefined;
    }
  });

  async function createCustomerWithLastVisit(daysAgo: number) {
    const customer = await prisma.customer.create({
      data: {
        establishmentId: cafeA.establishmentId,
        phone: `+32TESTRISK${daysAgo}`,
      },
    });
    customerId = customer.id;

    await prisma.event.create({
      data: {
        establishmentId: cafeA.establishmentId,
        customerId: customer.id,
        type: "visit",
        metadata: {},
        createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      },
    });

    return customer;
  }

  it(`a customer with a visit ${RISK_THRESHOLD_DAYS - 1} days ago counts as active, not at-risk`, async () => {
    const before = await getDashboardStats(cafeA.userId);
    await createCustomerWithLastVisit(RISK_THRESHOLD_DAYS - 1);
    const after = await getDashboardStats(cafeA.userId);

    expect(after.activeCustomers).toBe(before.activeCustomers + 1);
    expect(after.atRiskCustomers).toBe(before.atRiskCustomers);
  });

  it(`a customer with a visit ${RISK_THRESHOLD_DAYS + 1} days ago counts as at-risk, not active`, async () => {
    const before = await getDashboardStats(cafeA.userId);
    await createCustomerWithLastVisit(RISK_THRESHOLD_DAYS + 1);
    const after = await getDashboardStats(cafeA.userId);

    expect(after.atRiskCustomers).toBe(before.atRiskCustomers + 1);
    expect(after.activeCustomers).toBe(before.activeCustomers);
  });

  it("customer list reflects the new customer with the correct visit count", async () => {
    await createCustomerWithLastVisit(5);
    const list = await getCustomerList(cafeA.userId, "lastVisit");
    const row = list.find((c) => c.id === customerId);

    expect(row).toBeDefined();
    expect(row!.visit_count).toBe(1);
  });
});
