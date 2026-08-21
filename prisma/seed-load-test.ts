import "dotenv/config";
import { prisma } from "@/lib/prisma";

const CUSTOMER_COUNT = 200;

function randomPhone(i: number) {
  return `+32LOADTEST${String(i).padStart(5, "0")}`;
}

async function main() {
  const cafeA = await prisma.establishmentUser.findFirstOrThrow({
    where: { email: "cafe-a@test.fidoo.app" },
  });

  for (let i = 0; i < CUSTOMER_COUNT; i++) {
    // Spread last-visit recency across ~0-90 days so both "active" and
    // "at risk" buckets are populated, exercising the dashboard's real query
    // shape rather than a uniform best case.
    const daysAgoOfLastVisit = Math.floor(Math.random() * 90);
    const visitCount = 1 + Math.floor(Math.random() * 8);

    const customer = await prisma.customer.create({
      data: {
        establishmentId: cafeA.establishmentId,
        phone: randomPhone(i),
        name: `Client Test ${i}`,
      },
    });

    const visitDays = [daysAgoOfLastVisit];
    for (let v = 1; v < visitCount; v++) {
      visitDays.push(daysAgoOfLastVisit + v * 3);
    }

    await prisma.event.createMany({
      data: visitDays.map((days) => ({
        establishmentId: cafeA.establishmentId,
        customerId: customer.id,
        type: "visit",
        metadata: {},
        createdAt: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      })),
    });
  }

  console.log(`Seeded ${CUSTOMER_COUNT} load-test customers for Café A`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
