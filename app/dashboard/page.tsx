import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { asEstablishmentUser } from "@/lib/db/scoped";
import { getDashboardStats } from "@/lib/loyalty/stats";
import { getCampaignStats } from "@/lib/winback/stats";
import { logout } from "./actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const establishmentUser = await asEstablishmentUser(user.id, (tx) =>
    tx.establishmentUser.findUnique({
      where: { id: user.id },
      include: { establishment: true },
    })
  );

  if (!establishmentUser) {
    redirect("/login?error=no-establishment");
  }

  const stats = await getDashboardStats(user.id);
  const campaigns = await getCampaignStats(user.id);

  return (
    <div className="min-h-screen bg-zinc-50 p-8 dark:bg-black">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">
            Bienvenue {establishmentUser.establishment.name}
          </h1>
          <form action={logout}>
            <button
              type="submit"
              className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Se déconnecter
            </button>
          </form>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400">
          {establishmentUser.establishment.city} —{" "}
          {establishmentUser.establishment.plan}
        </p>

        <div className="grid grid-cols-3 gap-4">
          <div className="rounded border border-zinc-300 p-4 dark:border-zinc-700">
            <p className="text-2xl font-semibold">{stats.activeCustomers}</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Clients actifs
            </p>
          </div>
          <div className="rounded border border-zinc-300 p-4 dark:border-zinc-700">
            <p className="text-2xl font-semibold">{stats.visitsThisWeek}</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Visites cette semaine
            </p>
          </div>
          <div className="rounded border border-zinc-300 p-4 dark:border-zinc-700">
            <p className="text-2xl font-semibold">{stats.atRiskCustomers}</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Clients à risque
            </p>
          </div>
        </div>

        {campaigns.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-zinc-500">
              Campagnes de réactivation
            </h2>
            <div className="space-y-2">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.campaignId}
                  className="rounded border border-zinc-300 p-3 text-sm dark:border-zinc-700"
                >
                  <p>
                    {campaign.sentAt.toLocaleDateString("fr-BE")} —{" "}
                    {campaign.targeted} client
                    {campaign.targeted > 1 ? "s" : ""} ciblé
                    {campaign.targeted > 1 ? "s" : ""}, {campaign.returned}{" "}
                    revenu{campaign.returned > 1 ? "s" : ""}
                    {campaign.revenueCents > 0 &&
                      `, ~${(campaign.revenueCents / 100).toFixed(0)}€ de CA attribué`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <a
            href="/dashboard/scan"
            className="inline-block rounded bg-black px-4 py-2 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Scanner un client
          </a>
          <a
            href="/dashboard/customers"
            className="inline-block rounded border border-zinc-300 px-4 py-2 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Voir les clients
          </a>
        </div>
      </div>
    </div>
  );
}
