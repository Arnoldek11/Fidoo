import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getPublicEstablishment } from "@/lib/loyalty/publicJoin";
import { DEFAULT_REDEMPTION_COST } from "@/lib/loyalty/events";
import { StampProgress } from "@/components/loyalty/stamp-progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Illustrative: this preview isn't reachable from a real signup (see the
// join page), so there's no real customer here yet — just a first-stamp
// example, consistent with the goal used on the real customer card.
const PREVIEW_BALANCE = 1;

export default async function JoinWelcomePage({
  params,
}: {
  params: Promise<{ establishmentId: string }>;
}) {
  const { establishmentId } = await params;
  const establishment = await getPublicEstablishment(establishmentId);
  if (!establishment) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 py-10">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center text-center">
        <h1 className="text-2xl font-semibold text-foreground">Bienvenue chez {establishment.name} 👋</h1>
        <p className="mt-2 text-muted-foreground">Votre carte de fidélité est prête.</p>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <StampProgress balance={PREVIEW_BALANCE} goal={DEFAULT_REDEMPTION_COST} />
        </div>

        <div className="mt-8 space-y-2.5">
          <Button disabled title="Bientôt disponible" className="w-full bg-neutral-950 text-white hover:bg-neutral-950">
            Ajouter à Apple Wallet
          </Button>
          <Button disabled title="Bientôt disponible" variant="outline" className="w-full">
            Ajouter à Google Wallet
          </Button>
        </div>

        <Link href="/" className="mt-4 text-sm text-muted-foreground hover:text-foreground">
          Pas maintenant
        </Link>
      </div>

      <a
        href={`/join/${establishmentId}`}
        className="mx-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Aperçu : écran précédent
      </a>
    </div>
  );
}
