import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  getDashboardStats,
  getCustomerList,
  getCustomerHistory,
  getOverviewStats,
  getActivitySeries,
  getRecentActivity,
  RISK_THRESHOLD_DAYS,
  VIP_VISIT_THRESHOLD,
  NEW_CUSTOMER_DAYS,
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
    const list = await getCustomerList(cafeA.userId, { sort: "lastVisit" });
    const row = list.find((c) => c.id === customerId);

    expect(row).toBeDefined();
    expect(row!.visit_count).toBe(1);
  });
});

describe("getCustomerList filters", () => {
  let cafeA: { userId: string; establishmentId: string };
  let ids: string[] = [];

  beforeAll(async () => {
    const a = await prisma.establishmentUser.findFirstOrThrow({
      where: { email: "cafe-a@test.fidoo.app" },
    });
    cafeA = { userId: a.id, establishmentId: a.establishmentId };
  });

  afterEach(async () => {
    for (const id of ids) {
      await prisma.customer.delete({ where: { id } }).catch(() => {});
    }
    ids = [];
  });

  it("search matches by name, not by an unrelated customer", async () => {
    const customer = await prisma.customer.create({
      data: {
        establishmentId: cafeA.establishmentId,
        phone: "+32TESTSEARCH1",
        name: "Zzyzx Unique Name",
      },
    });
    ids.push(customer.id);

    const found = await getCustomerList(cafeA.userId, { search: "Zzyzx" });
    const notFound = await getCustomerList(cafeA.userId, { search: "NoSuchNameAtAll" });

    expect(found.some((c) => c.id === customer.id)).toBe(true);
    expect(notFound.some((c) => c.id === customer.id)).toBe(false);
  });

  it(`vip filter includes a customer with ${VIP_VISIT_THRESHOLD} visits and excludes one with fewer`, async () => {
    const vip = await prisma.customer.create({
      data: { establishmentId: cafeA.establishmentId, phone: "+32TESTVIP" },
    });
    ids.push(vip.id);
    await prisma.event.createMany({
      data: Array.from({ length: VIP_VISIT_THRESHOLD }, (_, i) => ({
        establishmentId: cafeA.establishmentId,
        customerId: vip.id,
        type: "visit",
        metadata: {},
        createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      })),
    });

    const regular = await prisma.customer.create({
      data: { establishmentId: cafeA.establishmentId, phone: "+32TESTNOTVIP" },
    });
    ids.push(regular.id);
    await prisma.event.create({
      data: {
        establishmentId: cafeA.establishmentId,
        customerId: regular.id,
        type: "visit",
        metadata: {},
      },
    });

    const vipList = await getCustomerList(cafeA.userId, { filter: "vip" });

    expect(vipList.some((c) => c.id === vip.id)).toBe(true);
    expect(vipList.some((c) => c.id === regular.id)).toBe(false);
  });

  it("new filter includes a customer created today, excludes an older one", async () => {
    const recent = await prisma.customer.create({
      data: { establishmentId: cafeA.establishmentId, phone: "+32TESTNEW" },
    });
    ids.push(recent.id);

    const old = await prisma.customer.create({
      data: {
        establishmentId: cafeA.establishmentId,
        phone: "+32TESTOLD",
        createdAt: new Date(Date.now() - (NEW_CUSTOMER_DAYS + 5) * 24 * 60 * 60 * 1000),
      },
    });
    ids.push(old.id);

    const newList = await getCustomerList(cafeA.userId, { filter: "new" });

    expect(newList.some((c) => c.id === recent.id)).toBe(true);
    expect(newList.some((c) => c.id === old.id)).toBe(false);
  });

  it(`risk filter includes a customer whose last visit was ${RISK_THRESHOLD_DAYS + 1} days ago`, async () => {
    const atRisk = await prisma.customer.create({
      data: { establishmentId: cafeA.establishmentId, phone: "+32TESTLISTRISK" },
    });
    ids.push(atRisk.id);
    await prisma.event.create({
      data: {
        establishmentId: cafeA.establishmentId,
        customerId: atRisk.id,
        type: "visit",
        metadata: {},
        createdAt: new Date(Date.now() - (RISK_THRESHOLD_DAYS + 1) * 24 * 60 * 60 * 1000),
      },
    });

    const riskList = await getCustomerList(cafeA.userId, { filter: "risk" });

    expect(riskList.some((c) => c.id === atRisk.id)).toBe(true);
  });

  it("points reflects points_added minus reward_redeemed, matching computeBalance", async () => {
    const customer = await prisma.customer.create({
      data: { establishmentId: cafeA.establishmentId, phone: "+32TESTPOINTS" },
    });
    ids.push(customer.id);
    await prisma.event.create({
      data: {
        establishmentId: cafeA.establishmentId,
        customerId: customer.id,
        type: "points_added",
        metadata: { points: 5 },
      },
    });
    await prisma.event.create({
      data: {
        establishmentId: cafeA.establishmentId,
        customerId: customer.id,
        type: "reward_redeemed",
        metadata: { points: 2 },
      },
    });

    const list = await getCustomerList(cafeA.userId, {});
    const row = list.find((c) => c.id === customer.id);

    expect(row?.points).toBe(3);
  });
});

describe("getCustomerHistory", () => {
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

  it("aggregates visitCount, points and lastVisitAt from the same events it returns", async () => {
    const customer = await prisma.customer.create({
      data: { establishmentId: cafeA.establishmentId, phone: "+32TESTHISTORY" },
    });
    customerId = customer.id;

    const older = new Date(Date.now() - 2 * 60_000);
    const newer = new Date(Date.now() - 60_000);
    await prisma.event.create({
      data: {
        establishmentId: cafeA.establishmentId,
        customerId: customer.id,
        type: "visit",
        metadata: {},
        createdAt: older,
      },
    });
    await prisma.event.create({
      data: {
        establishmentId: cafeA.establishmentId,
        customerId: customer.id,
        type: "visit",
        metadata: {},
        createdAt: newer,
      },
    });
    await prisma.event.create({
      data: {
        establishmentId: cafeA.establishmentId,
        customerId: customer.id,
        type: "points_added",
        metadata: { points: 2 },
        createdAt: newer,
      },
    });

    const data = await getCustomerHistory(cafeA.userId, customer.id);

    expect(data).not.toBeNull();
    expect(data!.visitCount).toBe(2);
    expect(data!.points).toBe(2);
    expect(data!.lastVisitAt?.getTime()).toBe(newer.getTime());
    expect(data!.status).toBe("new");
  });

  it("returns null for a customer id from another establishment (RLS)", async () => {
    const other = await prisma.establishmentUser.findFirstOrThrow({
      where: { email: "cafe-b@test.fidoo.app" },
    });
    const foreignCustomer = await prisma.customer.create({
      data: { establishmentId: other.establishmentId, phone: "+32TESTFOREIGN" },
    });

    const data = await getCustomerHistory(cafeA.userId, foreignCustomer.id);

    expect(data).toBeNull();
    await prisma.customer.delete({ where: { id: foreignCustomer.id } });
  });
});

describe("getOverviewStats", () => {
  let cafeA: { userId: string; establishmentId: string };
  let ids: string[] = [];

  beforeAll(async () => {
    const a = await prisma.establishmentUser.findFirstOrThrow({
      where: { email: "cafe-a@test.fidoo.app" },
    });
    cafeA = { userId: a.id, establishmentId: a.establishmentId };
  });

  afterEach(async () => {
    for (const id of ids) {
      await prisma.customer.delete({ where: { id } }).catch(() => {});
    }
    ids = [];
  });

  async function customerWithVisits(daysAgoList: number[], phoneSuffix: string) {
    const customer = await prisma.customer.create({
      // Backdated a minute, not left at the DB default `now()`: comparing a
      // just-inserted row's timestamp against a `now()` fetched moments
      // later can lose a race to a few hundred ms of clock skew across
      // pooled connections. Days-wide KPI windows never notice; an
      // instant-created fixture can.
      data: {
        establishmentId: cafeA.establishmentId,
        phone: `+32TESTOVERVIEW${phoneSuffix}`,
        createdAt: new Date(Date.now() - 60_000),
      },
    });
    ids.push(customer.id);
    for (const daysAgo of daysAgoList) {
      await prisma.event.create({
        data: {
          establishmentId: cafeA.establishmentId,
          customerId: customer.id,
          type: "visit",
          metadata: {},
          createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
        },
      });
    }
    return customer;
  }

  it("a visit within the period is counted in visits, not in the previous period", async () => {
    const before = await getOverviewStats(cafeA.userId, 30);
    await customerWithVisits([1], "V1");
    const after = await getOverviewStats(cafeA.userId, 30);

    expect(after.visits.value).toBe(before.visits.value + 1);
  });

  it("a reward_redeemed event within the period is counted in rewardsRedeemed", async () => {
    const customer = await prisma.customer.create({
      data: {
        establishmentId: cafeA.establishmentId,
        phone: "+32TESTOVERVIEWREWARD",
        createdAt: new Date(Date.now() - 60_000),
      },
    });
    ids.push(customer.id);
    const before = await getOverviewStats(cafeA.userId, 30);
    await prisma.event.create({
      data: {
        establishmentId: cafeA.establishmentId,
        customerId: customer.id,
        type: "reward_redeemed",
        metadata: { points: 10 },
        createdAt: new Date(Date.now() - 60_000),
      },
    });
    const after = await getOverviewStats(cafeA.userId, 30);

    expect(after.rewardsRedeemed.value).toBe(before.rewardsRedeemed.value + 1);
  });

  it(`a visit ${RISK_THRESHOLD_DAYS - 1} days ago counts toward loyalCustomers`, async () => {
    const before = await getOverviewStats(cafeA.userId, 30);
    await customerWithVisits([RISK_THRESHOLD_DAYS - 1], "LOYAL");
    const after = await getOverviewStats(cafeA.userId, 30);

    expect(after.loyalCustomers.value).toBe(before.loyalCustomers.value + 1);
  });

  it("a customer with a single visit can only lower or hold the return rate", async () => {
    const before = await getOverviewStats(cafeA.userId, 30);
    await customerWithVisits([1], "SINGLE");
    const after = await getOverviewStats(cafeA.userId, 30);

    expect(after.returnRate.value).toBeLessThanOrEqual(before.returnRate.value);
  });

  it("a customer with two visits can only raise or hold the return rate", async () => {
    const before = await getOverviewStats(cafeA.userId, 30);
    await customerWithVisits([5, 1], "REPEAT");
    const after = await getOverviewStats(cafeA.userId, 30);

    expect(after.returnRate.value).toBeGreaterThanOrEqual(before.returnRate.value);
  });
});

describe("getActivitySeries", () => {
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

  it("buckets a visit created now under today", async () => {
    const customer = await prisma.customer.create({
      data: { establishmentId: cafeA.establishmentId, phone: "+32TESTSERIESVISIT" },
    });
    customerId = customer.id;
    await prisma.event.create({
      data: {
        establishmentId: cafeA.establishmentId,
        customerId: customer.id,
        type: "visit",
        metadata: {},
      },
    });

    const series = await getActivitySeries(cafeA.userId, 30);
    const today = series.at(-1)!;

    expect(today.visits).toBeGreaterThanOrEqual(1);
  });
});

describe("getRecentActivity", () => {
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

  it("surfaces a newly created customer as a new_customer item", async () => {
    const customer = await prisma.customer.create({
      data: {
        establishmentId: cafeA.establishmentId,
        phone: "+32TESTFEEDNEWCUST",
        name: "Feed Test Customer",
      },
    });
    customerId = customer.id;

    const feed = await getRecentActivity(cafeA.userId, 20);
    const item = feed.find((i) => i.id === customerId);

    expect(item).toBeDefined();
    expect(item!.kind).toBe("new_customer");
    expect(item!.customerLabel).toBe("Feed Test Customer");
  });

  it("surfaces a visit event with the customer's name", async () => {
    const customer = await prisma.customer.create({
      data: {
        establishmentId: cafeA.establishmentId,
        phone: "+32TESTFEEDVISIT",
        name: "Feed Visit Customer",
      },
    });
    customerId = customer.id;
    const visit = await prisma.event.create({
      data: {
        establishmentId: cafeA.establishmentId,
        customerId: customer.id,
        type: "visit",
        metadata: {},
      },
    });

    const feed = await getRecentActivity(cafeA.userId, 20);
    const item = feed.find((i) => i.id === visit.id);

    expect(item).toBeDefined();
    expect(item!.kind).toBe("visit");
    expect(item!.customerLabel).toBe("Feed Visit Customer");
  });
});
