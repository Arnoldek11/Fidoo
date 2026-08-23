import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCampaignStats } from "@/lib/winback/stats";
import { getWinbackEligibleCount } from "@/lib/winback/detect";
import { getCustomerList, RISK_THRESHOLD_DAYS } from "@/lib/loyalty/stats";
import { SuggestionCard } from "@/components/dashboard/campaigns/suggestion-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, UserMinus, Crown, Cake } from "lucide-react";

export default async function CampaignsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [eligibleCount, vipCustomers, campaigns] = await Promise.all([
    getWinbackEligibleCount(user.id),
    getCustomerList(user.id, { filter: "vip" }),
    getCampaignStats(user.id),
  ]);
  const vipCount = vipCustomers.length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Campagnes</h1>
          <p className="mt-1 text-muted-foreground">Comment les faire revenir ?</p>
        </div>
        <Button disabled title="Bientôt disponible">
          <Plus />
          Nouvelle campagne
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <SuggestionCard
          icon={UserMinus}
          title="Vos clients vous manquent"
          description={`${eligibleCount} client${eligibleCount > 1 ? "s" : ""} n'${
            eligibleCount > 1 ? "ont" : "a"
          } pas revenu${eligibleCount > 1 ? "s" : ""} depuis ${RISK_THRESHOLD_DAYS} jours.`}
          ctaLabel="Automatique"
          ctaTitle="Un SMS de réactivation part automatiquement chaque nuit vers les clients éligibles — rien à faire ici."
        />
        <SuggestionCard
          icon={Crown}
          title="Vos meilleurs clients"
          description={`${vipCount} client${vipCount > 1 ? "s" : ""} VIP.`}
          ctaLabel="Créer une offre VIP"
        />
        <SuggestionCard
          icon={Cake}
          title="Anniversaires"
          description="La date d'anniversaire de vos clients n'est pas encore collectée."
          ctaLabel="Créer une surprise"
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Historique des campagnes</h2>
        {campaigns.length === 0 ? (
          <Card className="border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Aucune campagne envoyée pour le moment.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {campaigns.map((campaign) => (
              <Card
                key={campaign.campaignId}
                className="border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
              >
                <CardContent className="text-sm">
                  <span className="font-medium">
                    {campaign.sentAt.toLocaleDateString("fr-BE")}
                  </span>{" "}
                  — {campaign.targeted} client
                  {campaign.targeted > 1 ? "s" : ""} ciblé
                  {campaign.targeted > 1 ? "s" : ""}, {campaign.returned} revenu
                  {campaign.returned > 1 ? "s" : ""}
                  {campaign.revenueCents > 0 &&
                    `, ~${(campaign.revenueCents / 100).toFixed(0)}€ de CA attribué`}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
