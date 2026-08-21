import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { asEstablishmentUser } from "@/lib/db/scoped";

// Extends the Phase 1 isolation guarantee (see lib/db/scoped.test.ts) to the
// Phase 2 tables: a user authenticated as one establishment must never be
// able to read or write another establishment's customers/events, and the
// events journal must be genuinely append-only even for its own tenant.
describe("customers/events RLS isolation", () => {
  let cafeA: { userId: string; establishmentId: string };
  let cafeB: { userId: string; establishmentId: string };
  let cafeBCustomerId: string;

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

    const customer = await prisma.customer.create({
      data: { establishmentId: cafeB.establishmentId, phone: "+32000000099" },
    });
    cafeBCustomerId = customer.id;
  });

  afterAll(async () => {
    await prisma.customer.delete({ where: { id: cafeBCustomerId } }).catch(() => {});
  });

  it("cannot list another establishment's customers", async () => {
    const rows = await asEstablishmentUser(cafeA.userId, (tx) =>
      tx.customer.findMany({ where: { establishmentId: cafeB.establishmentId } })
    );
    expect(rows).toHaveLength(0);
  });

  it("cannot erase another establishment's customer", async () => {
    await expect(
      asEstablishmentUser(cafeA.userId, (tx) =>
        tx.customer.delete({ where: { id: cafeBCustomerId } })
      )
    ).rejects.toThrow();

    const stillThere = await prisma.customer.findUnique({
      where: { id: cafeBCustomerId },
    });
    expect(stillThere).not.toBeNull();
  });

  it("cannot insert an event tagged with another establishment's id", async () => {
    await expect(
      asEstablishmentUser(cafeA.userId, (tx) =>
        tx.event.create({
          data: {
            establishmentId: cafeB.establishmentId,
            customerId: cafeBCustomerId,
            type: "visit",
            metadata: {},
          },
        })
      )
    ).rejects.toThrow();
  });

  it("events cannot be updated or deleted, even within one's own establishment", async () => {
    const ownCustomer = await prisma.customer.create({
      data: { establishmentId: cafeA.establishmentId, phone: "+32000000098" },
    });

    const event = await asEstablishmentUser(cafeA.userId, (tx) =>
      tx.event.create({
        data: {
          establishmentId: cafeA.establishmentId,
          customerId: ownCustomer.id,
          type: "visit",
          metadata: {},
        },
      })
    );

    await expect(
      asEstablishmentUser(cafeA.userId, (tx) =>
        tx.event.update({
          where: { id: event.id },
          data: { type: "reward_redeemed" },
        })
      )
    ).rejects.toThrow();

    await expect(
      asEstablishmentUser(cafeA.userId, (tx) =>
        tx.event.delete({ where: { id: event.id } })
      )
    ).rejects.toThrow();

    await prisma.customer.delete({ where: { id: ownCustomer.id } }).catch(() => {});
  });
});
