import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StampProgress } from "@/components/loyalty/stamp-progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { POINTS_PER_VISIT, DEFAULT_REDEMPTION_COST } from "@/lib/loyalty/events";
import { Settings2 } from "lucide-react";

const PREVIEW_BALANCE = 7;

export default async function LoyaltyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Fidélité</h1>
          <p className="mt-1 text-muted-foreground">
            Qu&apos;est-ce que vous offrez à vos clients fidèles ?
          </p>
        </div>
        <Button disabled title="Bientôt disponible">
          <Settings2 />
          Modifier le programme
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] [--card-spacing:--spacing(6)]">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-base">Aperçu de la carte</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <StampProgress balance={PREVIEW_BALANCE} goal={DEFAULT_REDEMPTION_COST} />
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Exemple d&apos;affichage — la progression réelle de chaque client est visible sur sa
              fiche.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] [--card-spacing:--spacing(6)]">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-base">Règles du programme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-center justify-between rounded-[10px] bg-muted px-4 py-3">
              <span className="text-sm text-foreground">1 visite</span>
              <span className="text-sm font-medium text-foreground">
                = {POINTS_PER_VISIT} point{POINTS_PER_VISIT > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-[10px] bg-muted px-4 py-3">
              <span className="text-sm text-foreground">{DEFAULT_REDEMPTION_COST} points</span>
              <span className="text-sm font-medium text-foreground">= 1 récompense</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
