import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCampaignStats } from "@/lib/winback/stats";
import { getWinbackEligibleCount } from "@/lib/winback/detect";
import { getCustomerList, RISK_THRESHOLD_DAYS } from "@/lib/loyalty/stats";
import { SuggestionCard } from "@/components/dashboard/campaigns/suggestion-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, UserMinus, Crown, Cake, Megaphone } from "lucide-react";

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
          <h1 className="font-heading text-2xl font-bold tracking-tight text-[#3A322B]">Campagnes</h1>
          <p className="mt-1 font-medium text-[#8A7D6C]">Comment les faire revenir ?</p>
        </div>
        <Button
          disabled
          title="Bientôt disponible"
          className="rounded-full px-4 shadow-[0_8px_18px_rgba(255,90,95,0.32)]"
        >
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

      <Card
        className="rounded-[24px] border-none bg-white [--card-spacing:--spacing(5.5)]"
        style={{ boxShadow: "0 14px 28px -10px rgba(74,64,56,0.1)" }}
      >
        <CardHeader>
          <CardTitle className="font-heading text-base font-bold text-[#3A322B]">
            Historique des campagnes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <p className="py-6 text-center text-sm font-medium text-[#8A7D6C]">
              Aucune campagne envoyée pour le moment.
            </p>
          ) : (
            <ul className="divide-y divide-[#F6ECDD]">
              {campaigns.map((campaign) => (
                <li
                  key={campaign.campaignId}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary-tint text-primary">
                    <Megaphone className="size-4" strokeWidth={2} />
                  </span>
                  <span className="flex-1 text-sm font-semibold text-[#3A322B]">
                    {campaign.sentAt.toLocaleDateString("fr-BE")} — {campaign.targeted} client
                    {campaign.targeted > 1 ? "s" : ""} ciblé
                    {campaign.targeted > 1 ? "s" : ""}, {campaign.returned} revenu
                    {campaign.returned > 1 ? "s" : ""}
                    {campaign.revenueCents > 0 &&
                      `, ~${(campaign.revenueCents / 100).toFixed(0)}€ de CA attribué`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
