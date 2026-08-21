import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDashboardStats } from "@/lib/loyalty/stats";
import { getCampaignStats } from "@/lib/winback/stats";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CalendarClock, AlertTriangle, QrCode, ListChecks } from "lucide-react";

const STAT_CARDS = [
  { key: "activeCustomers" as const, label: "Clients actifs", icon: Users },
  { key: "visitsThisWeek" as const, label: "Visites cette semaine", icon: CalendarClock },
  { key: "atRiskCustomers" as const, label: "Clients à risque", icon: AlertTriangle },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [stats, campaigns] = await Promise.all([
    getDashboardStats(user.id),
    getCampaignStats(user.id),
  ]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STAT_CARDS.map(({ key, label, icon: Icon }) => (
          <Card key={key}>
            <CardContent className="flex items-center gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-semibold leading-none">{stats[key]}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button render={<a href="/dashboard/scan" />}>
          <QrCode />
          Scanner un client
        </Button>
        <Button variant="outline" render={<a href="/dashboard/customers" />}>
          <ListChecks />
          Voir les clients
        </Button>
      </div>

      {campaigns.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Campagnes de réactivation
          </h2>
          <div className="space-y-2">
            {campaigns.map((campaign) => (
              <Card key={campaign.campaignId}>
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
        </div>
      )}
    </div>
  );
}
