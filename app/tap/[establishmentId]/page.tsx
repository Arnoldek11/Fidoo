import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { getPublicEstablishment } from "@/lib/loyalty/publicJoin";
import { TapExperience } from "./tap-experience";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * The URL written on the NFC pod / QR at the till. Opening the page never
 * writes anything by itself (a GET must stay side-effect free — link
 * prefetchers and messenger crawlers hit it too): the actual stamp is a
 * Server Action the client fires once mounted, TapStamp-style.
 */
export default async function TapPage({
  params,
}: {
  params: Promise<{ establishmentId: string }>;
}) {
  const { establishmentId } = await params;
  const establishment = await getPublicEstablishment(establishmentId);
  if (!establishment) notFound();

  const cookieStore = await cookies();
  const hasKnownCard = Boolean(cookieStore.get(`fidoo_card_${establishmentId}`)?.value);

  return (
    <TapExperience
      establishmentId={establishment.id}
      establishmentName={establishment.name}
      hasKnownCard={hasKnownCard}
    />
  );
}
