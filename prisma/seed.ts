import "dotenv/config";
import { prisma } from "@/lib/prisma";

const TEST_ACCOUNTS = [
  {
    authUserId: "6aa5c72c-3823-454f-9e0e-88aa329c55a0",
    email: "cafe-a@test.fidoo.app",
    establishment: { name: "Café A", city: "Bruxelles" },
  },
  {
    authUserId: "0618fbaf-ceb9-4f83-b3f3-f90ce74ef5bb",
    email: "cafe-b@test.fidoo.app",
    establishment: { name: "Café B", city: "Bruxelles" },
  },
];

async function main() {
  for (const account of TEST_ACCOUNTS) {
    const establishment = await prisma.establishment.create({
      data: account.establishment,
    });

    await prisma.establishmentUser.create({
      data: {
        id: account.authUserId,
        establishmentId: establishment.id,
        email: account.email,
        role: "owner",
      },
    });

    console.log(`Seeded ${account.establishment.name} (${establishment.id})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
