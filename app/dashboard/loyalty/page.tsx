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
          <h1 className="font-heading text-2xl font-bold tracking-tight text-[#3A322B]">Fidélité</h1>
          <p className="mt-1 font-medium text-[#8A7D6C]">
            Qu&apos;est-ce que vous offrez à vos clients fidèles ?
          </p>
        </div>
        <Button disabled title="Bientôt disponible" className="rounded-full px-4">
          <Settings2 />
          Modifier le programme
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card
          className="rounded-[22px] border-none bg-white [--card-spacing:--spacing(6)]"
          style={{ boxShadow: "0 14px 28px -10px rgba(74,64,56,0.1)" }}
        >
          <CardHeader className="border-b border-[#F6ECDD] pb-4">
            <CardTitle className="font-heading text-base font-bold text-[#3A322B]">
              Aperçu de la carte
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <StampProgress balance={PREVIEW_BALANCE} goal={DEFAULT_REDEMPTION_COST} />
            <p className="mt-4 text-center text-xs font-medium text-[#B0A290]">
              Exemple d&apos;affichage — la progression réelle de chaque client est visible sur sa
              fiche.
            </p>
          </CardContent>
        </Card>

        <Card
          className="rounded-[22px] border-none bg-white [--card-spacing:--spacing(6)]"
          style={{ boxShadow: "0 14px 28px -10px rgba(74,64,56,0.1)" }}
        >
          <CardHeader className="border-b border-[#F6ECDD] pb-4">
            <CardTitle className="font-heading text-base font-bold text-[#3A322B]">
              Règles du programme
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-center justify-between rounded-2xl bg-[#F6ECDD] px-4 py-3">
              <span className="text-sm font-medium text-[#5B4F44]">1 visite</span>
              <span className="text-sm font-bold text-[#3A322B]">
                = {POINTS_PER_VISIT} point{POINTS_PER_VISIT > 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-[#F6ECDD] px-4 py-3">
              <span className="text-sm font-medium text-[#5B4F44]">{DEFAULT_REDEMPTION_COST} points</span>
              <span className="text-sm font-bold text-[#3A322B]">= 1 récompense</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
