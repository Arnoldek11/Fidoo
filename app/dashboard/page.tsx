import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { asEstablishmentUser } from "@/lib/db/scoped";
import {
  getOverviewStats,
  getActivitySeries,
  getRecentActivity,
  PERIODS,
  type Period,
} from "@/lib/loyalty/stats";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PeriodSelect } from "@/components/dashboard/period-select";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

function isPeriod(value: number): value is Period {
  return (PERIODS as readonly number[]).includes(value);
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;
  const parsedPeriod = Number(periodParam);
  const period: Period = isPeriod(parsedPeriod) ? parsedPeriod : 30;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const establishmentUser = await asEstablishmentUser(user.id, (tx) =>
    tx.establishmentUser.findUnique({
      where: { id: user.id },
      include: { establishment: true },
    })
  );
  if (!establishmentUser) redirect("/login?error=no-establishment");

  const [stats, series, feed] = await Promise.all([
    getOverviewStats(user.id, period),
    getActivitySeries(user.id, period),
    getRecentActivity(user.id, 8),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Bonjour 👋</h1>
          <p className="mt-1 text-muted-foreground">
            Voici ce qui se passe chez {establishmentUser.establishment.name} aujourd&apos;hui.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodSelect period={period} />
          <Button render={<a href="/dashboard/campaigns" />}>
            <Plus />
            Créer une campagne
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Clients fidèles"
          value={stats.loyalCustomers.value}
          deltaPct={stats.loyalCustomers.deltaPct}
        />
        <KpiCard label="Visites" value={stats.visits.value} deltaPct={stats.visits.deltaPct} />
        <KpiCard
          label="Récompenses utilisées"
          value={stats.rewardsRedeemed.value}
          deltaPct={stats.rewardsRedeemed.deltaPct}
        />
        <KpiCard
          label="Taux de retour"
          value={stats.returnRate.value}
          deltaPct={stats.returnRate.deltaPct}
          percent
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ActivityChart data={series} />
        </div>
        <ActivityFeed items={feed} />
      </div>
    </div>
  );
}
