import { prisma } from "@/lib/prisma";

export type PublicEstablishment = {
  id: string;
  name: string;
};

/**
 * Public, unauthenticated lookup by establishment id — same trust model as
 * getCustomerCard in publicCard.ts: no logged-in user, so this deliberately
 * skips asEstablishmentUser/RLS. Safe because it only ever returns the one
 * row matching the id in the URL (itself not a secret — it's meant to be
 * shared via a QR code), never a list.
 */
export async function getPublicEstablishment(
  establishmentId: string
): Promise<PublicEstablishment | null> {
  const establishment = await prisma.establishment.findUnique({
    where: { id: establishmentId },
    select: { id: true, name: true },
  });
  return establishment;
}
