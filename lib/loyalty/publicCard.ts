import { prisma } from "@/lib/prisma";
import { computeBalance } from "@/lib/loyalty/events";
import { getPublicProgram, type ProgramSettings } from "@/lib/loyalty/program";

export type CustomerCard = ProgramSettings & {
  name: string | null;
  establishmentName: string;
  balance: number;
};

/**
 * Public, unauthenticated lookup by customer id — there is no logged-in
 * establishment user here, so this deliberately does NOT go through
 * asEstablishmentUser/RLS. Safety instead comes from the query itself: it
 * only ever returns the single row matching the (unguessable, random UUID)
 * id passed in, never a list or anything scoped by establishment. Treat the
 * id like a bearer link, the same trust model as an unlisted document link.
 */
export async function getCustomerCard(customerId: string): Promise<CustomerCard | null> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { establishment: true },
  });
  if (!customer) return null;

  const [events, program] = await Promise.all([
    prisma.event.findMany({
      where: {
        customerId,
        type: { in: ["points_added", "reward_redeemed", "points_reversed"] },
      },
      select: { type: true, metadata: true },
    }),
    getPublicProgram(customer.establishmentId),
  ]);

  return {
    ...program,
    name: customer.name,
    establishmentName: customer.establishment.name,
    balance: computeBalance(events),
  };
}
