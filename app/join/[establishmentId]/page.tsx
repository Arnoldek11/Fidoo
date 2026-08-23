import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicEstablishment } from "@/lib/loyalty/publicJoin";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function JoinPage({
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
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary-tint text-2xl font-semibold text-primary">
          {establishment.name.trim().charAt(0).toUpperCase()}
        </span>
        <p className="mt-3 text-sm font-medium text-muted-foreground">{establishment.name}</p>

        <h1 className="mt-6 text-2xl font-semibold text-foreground">
          Rejoignez notre programme fidélité
        </h1>
        <p className="mt-2 text-muted-foreground">Des récompenses, simplement.</p>

        <div className="mt-8 space-y-2.5">
          <Button
            disabled
            title="Bientôt disponible"
            className="w-full bg-neutral-950 text-white hover:bg-neutral-950"
          >
            Continuer avec Apple
          </Button>
          <Button
            disabled
            title="Bientôt disponible"
            variant="outline"
            className="w-full"
          >
            Continuer avec Google
          </Button>
          <Button
            disabled
            title="Bientôt disponible"
            variant="outline"
            className="w-full"
          >
            Continuer avec le numéro de téléphone
          </Button>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Gratuit · 10 secondes · Aucun téléchargement
        </p>
      </div>

      <a
        href={`/join/${establishmentId}/welcome`}
        className="mx-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        Aperçu de l&apos;écran suivant
        <ArrowRight className="size-3.5" />
      </a>
    </div>
  );
}
