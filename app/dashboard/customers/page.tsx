import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCustomerList, type CustomerSort } from "@/lib/loyalty/stats";
import { RISK_THRESHOLD_DAYS } from "@/lib/loyalty/stats";

const SORT_OPTIONS: { value: CustomerSort; label: string }[] = [
  { value: "lastVisit", label: "Dernière visite" },
  { value: "visits", label: "Nombre de visites" },
  { value: "name", label: "Nom" },
];

function isAtRisk(lastVisitAt: Date | null): boolean {
  if (!lastVisitAt) return false;
  const daysSince = (Date.now() - lastVisitAt.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince >= RISK_THRESHOLD_DAYS;
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort: rawSort } = await searchParams;
  const sort: CustomerSort =
    rawSort === "visits" || rawSort === "name" ? rawSort : "lastVisit";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const customers = await getCustomerList(user.id, sort);

  return (
    <div className="min-h-screen bg-zinc-50 p-8 dark:bg-black">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Clients</h1>
          <a href="/dashboard" className="text-sm text-zinc-500 hover:underline">
            ← Tableau de bord
          </a>
        </div>

        <div className="flex gap-2 text-sm">
          <span className="text-zinc-500">Trier par :</span>
          {SORT_OPTIONS.map((option) => (
            <a
              key={option.value}
              href={`/dashboard/customers?sort=${option.value}`}
              className={
                sort === option.value
                  ? "font-semibold underline"
                  : "text-zinc-500 hover:underline"
              }
            >
              {option.label}
            </a>
          ))}
        </div>

        <div className="overflow-x-auto rounded border border-zinc-300 dark:border-zinc-700">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-300 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-2">Nom / Téléphone</th>
                <th className="px-4 py-2">Visites</th>
                <th className="px-4 py-2">Dernière visite</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="border-b border-zinc-200 last:border-0 dark:border-zinc-800"
                >
                  <td className="px-4 py-2">
                    <a
                      href={`/dashboard/customers/${customer.id}`}
                      className="hover:underline"
                    >
                      {customer.name ?? customer.phone}
                    </a>
                    {customer.name && (
                      <span className="text-zinc-500"> — {customer.phone}</span>
                    )}
                  </td>
                  <td className="px-4 py-2">{customer.visit_count}</td>
                  <td className="px-4 py-2">
                    {customer.last_visit_at
                      ? customer.last_visit_at.toLocaleDateString("fr-BE")
                      : "—"}
                    {isAtRisk(customer.last_visit_at) && (
                      <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
                        à risque
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-zinc-500">
                    Aucun client pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
