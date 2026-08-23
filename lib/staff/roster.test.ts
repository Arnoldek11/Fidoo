import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createStaffMember,
  listActiveStaffMembers,
  setStaffMemberActive,
  verifyStaffMemberPin,
} from "@/lib/staff/roster";

describe("staff roster", () => {
  let cafeA: { userId: string; establishmentId: string };
  let cafeB: { userId: string; establishmentId: string };
  let staffIds: string[] = [];

  beforeAll(async () => {
    const [a, b] = await Promise.all([
      prisma.establishmentUser.findFirstOrThrow({ where: { email: "cafe-a@test.fidoo.app" } }),
      prisma.establishmentUser.findFirstOrThrow({ where: { email: "cafe-b@test.fidoo.app" } }),
    ]);
    cafeA = { userId: a.id, establishmentId: a.establishmentId };
    cafeB = { userId: b.id, establishmentId: b.establishmentId };
  });

  afterEach(async () => {
    if (staffIds.length) {
      await prisma.staffMember.deleteMany({ where: { id: { in: staffIds } } }).catch(() => {});
      staffIds = [];
    }
  });

  it("creates a staff member with a hashed PIN and lists them", async () => {
    const result = await createStaffMember(cafeA.userId, { name: "Alice", pin: "1234" });
    expect(result.status).toBe("ok");
    if (result.status === "ok") staffIds.push(result.id);

    const active = await listActiveStaffMembers(cafeA.userId);
    expect(active.some((s) => s.name === "Alice")).toBe(true);
  });

  it("rejects an invalid PIN before hitting the database", async () => {
    const result = await createStaffMember(cafeA.userId, { name: "Bob", pin: "12" });
    expect(result.status).toBe("invalid_pin");
  });

  it("rejects a duplicate name within the same establishment", async () => {
    const first = await createStaffMember(cafeA.userId, { name: "Carla", pin: "5555" });
    if (first.status === "ok") staffIds.push(first.id);

    const second = await createStaffMember(cafeA.userId, { name: "Carla", pin: "6666" });
    expect(second.status).toBe("duplicate_name");
  });

  it("verifies the correct PIN and rejects a wrong one, scoped to that staff member", async () => {
    const created = await createStaffMember(cafeA.userId, { name: "Dana", pin: "7890" });
    if (created.status !== "ok") throw new Error("setup failed");
    staffIds.push(created.id);

    expect(await verifyStaffMemberPin(cafeA.userId, created.id, "7890")).toBe(true);
    expect(await verifyStaffMemberPin(cafeA.userId, created.id, "0000")).toBe(false);
  });

  it("a deactivated staff member fails PIN verification even with the right PIN", async () => {
    const created = await createStaffMember(cafeA.userId, { name: "Eve", pin: "1111" });
    if (created.status !== "ok") throw new Error("setup failed");
    staffIds.push(created.id);

    await setStaffMemberActive(cafeA.userId, created.id, false);
    expect(await verifyStaffMemberPin(cafeA.userId, created.id, "1111")).toBe(false);
  });

  it("one establishment cannot see or verify PINs for another establishment's staff", async () => {
    const created = await createStaffMember(cafeA.userId, { name: "Frank", pin: "2468" });
    if (created.status !== "ok") throw new Error("setup failed");
    staffIds.push(created.id);

    const cafeBRoster = await listActiveStaffMembers(cafeB.userId);
    expect(cafeBRoster.some((s) => s.name === "Frank")).toBe(false);

    expect(await verifyStaffMemberPin(cafeB.userId, created.id, "2468")).toBe(false);
  });
});
