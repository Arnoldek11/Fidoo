import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getCustomerList,
  classifyCustomerStatus,
  type CustomerSort,
  type CustomerFilter,
} from "@/lib/loyalty/stats";
import { CustomerStatusBadge } from "@/components/dashboard/customer-status-badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

const FILTERS: { value: CustomerFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "vip", label: "VIP" },
  { value: "new", label: "Nouveaux" },
  { value: "risk", label: "À réactiver" },
];

const SORT_OPTIONS: { value: CustomerSort; label: string }[] = [
  { value: "lastVisit", label: "Dernière visite" },
  { value: "visits", label: "Visites" },
  { value: "name", label: "Nom" },
];

function formatSpend(cents: number | null) {
  if (cents === null) return "—";
  return `${(cents / 100).toLocaleString("fr-BE", { maximumFractionDigits: 0 })} €`;
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; filter?: string; q?: string }>;
}) {
  const { sort: rawSort, filter: rawFilter, q } = await searchParams;
  const sort: CustomerSort =
    rawSort === "visits" || rawSort === "name" ? rawSort : "lastVisit";
  const filter: CustomerFilter =
    rawFilter === "vip" || rawFilter === "new" || rawFilter === "risk" ? rawFilter : "all";
  const search = q?.trim() || undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const customers = await getCustomerList(user.id, { sort, filter, search });

  function withParams(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const next = { sort, filter, q: search, ...overrides };
    if (next.sort && next.sort !== "lastVisit") params.set("sort", next.sort);
    if (next.filter && next.filter !== "all") params.set("filter", next.filter);
    if (next.q) params.set("q", next.q);
    const qs = params.toString();
    return qs ? `/dashboard/customers?${qs}` : "/dashboard/customers";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-[#3A322B]">Clients</h1>
        <p className="mt-1 font-medium text-[#8A7D6C]">
          Découvrez et fidélisez vos meilleurs clients.
        </p>
      </div>

      <form method="get" className="relative max-w-sm">
        {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
        {sort !== "lastVisit" && <input type="hidden" name="sort" value={sort} />}
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#B0A290]" />
        <Input
          type="search"
          name="q"
          defaultValue={search ?? ""}
          placeholder="Rechercher un client..."
          className="h-10 rounded-full border-transparent bg-white pl-9 text-sm font-semibold text-[#4A4038] shadow-[0_2px_10px_rgba(74,64,56,0.06)]"
        />
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <a
              key={f.value}
              href={withParams({ filter: f.value === "all" ? undefined : f.value })}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all",
                filter === f.value
                  ? "bg-primary text-white shadow-[0_6px_16px_rgba(255,90,95,0.28)]"
                  : "text-[#8A7D6C] hover:bg-white hover:text-[#3A322B]"
              )}
            >
              {f.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-1 text-sm font-medium text-[#8A7D6C]">
          Trier :
          {SORT_OPTIONS.map((option) => (
            <a
              key={option.value}
              href={withParams({ sort: option.value === "lastVisit" ? undefined : option.value })}
              className={cn(
                "rounded-full px-2.5 py-1 transition-colors",
                sort === option.value
                  ? "font-bold text-[#3A322B]"
                  : "hover:text-[#3A322B]"
              )}
            >
              {option.label}
            </a>
          ))}
        </div>
      </div>

      <div
        className="overflow-hidden rounded-[24px] bg-white"
        style={{ boxShadow: "0 14px 28px -10px rgba(74,64,56,0.1)" }}
      >
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#F6ECDD] hover:bg-transparent">
              <TableHead className="h-11 px-4 text-[11px] font-semibold tracking-wide text-[#B0A290] uppercase">Client</TableHead>
              <TableHead className="text-[11px] font-semibold tracking-wide text-[#B0A290] uppercase">Visites</TableHead>
              <TableHead className="text-[11px] font-semibold tracking-wide text-[#B0A290] uppercase">Points</TableHead>
              <TableHead className="text-[11px] font-semibold tracking-wide text-[#B0A290] uppercase">Dernière visite</TableHead>
              <TableHead className="text-[11px] font-semibold tracking-wide text-[#B0A290] uppercase">Dépenses</TableHead>
              <TableHead className="px-4 text-[11px] font-semibold tracking-wide text-[#B0A290] uppercase">Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => {
              const initial = (customer.name ?? customer.phone).trim().charAt(0).toUpperCase();
              return (
                <TableRow
                  key={customer.id}
                  className="border-b border-[#F6ECDD] transition-colors last:border-0 hover:bg-[#FFF8F0]"
                >
                  <TableCell className="px-4 py-3.5">
                    <a
                      href={`/dashboard/customers/${customer.id}`}
                      className="flex items-center gap-3 hover:underline"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-tint text-sm font-semibold text-primary">
                        {initial}
                      </span>
                      <span>
                        <span className="font-semibold text-[#3A322B]">
                          {customer.name ?? customer.phone}
                        </span>
                        {customer.name && (
                          <span className="block text-xs font-medium text-[#B0A290]">
                            {customer.phone}
                          </span>
                        )}
                      </span>
                    </a>
                  </TableCell>
                  <TableCell className="py-3.5 font-medium text-[#5B4F44]">{customer.visit_count}</TableCell>
                  <TableCell className="py-3.5 font-medium text-[#5B4F44]">{customer.points}</TableCell>
                  <TableCell className="py-3.5 font-medium text-[#5B4F44]">
                    {customer.last_visit_at
                      ? customer.last_visit_at.toLocaleDateString("fr-BE")
                      : "—"}
                  </TableCell>
                  <TableCell className="py-3.5 font-medium text-[#5B4F44]">{formatSpend(customer.estimated_spend_cents)}</TableCell>
                  <TableCell className="px-4 py-3.5">
                    <CustomerStatusBadge status={classifyCustomerStatus(customer)} />
                  </TableCell>
                </TableRow>
              );
            })}
            {customers.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="py-10 text-center font-medium text-[#8A7D6C]">
                  {search || filter !== "all"
                    ? "Aucun client ne correspond à cette recherche."
                    : "Aucun client pour le moment."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
