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
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Clients</h1>
        <p className="mt-1 text-muted-foreground">
          Découvrez et fidélisez vos meilleurs clients.
        </p>
      </div>

      <form method="get" className="relative max-w-sm">
        {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
        {sort !== "lastVisit" && <input type="hidden" name="sort" value={sort} />}
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          name="q"
          defaultValue={search ?? ""}
          placeholder="Rechercher un client..."
          className="h-10 rounded-[10px] pl-9"
        />
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <a
              key={f.value}
              href={withParams({ filter: f.value === "all" ? undefined : f.value })}
              className={cn(
                "rounded-[10px] px-3 py-1.5 text-sm font-medium transition-colors",
                filter === f.value
                  ? "bg-primary-tint text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {f.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          Trier :
          {SORT_OPTIONS.map((option) => (
            <a
              key={option.value}
              href={withParams({ sort: option.value === "lastVisit" ? undefined : option.value })}
              className={cn(
                "rounded-[10px] px-2 py-1 transition-colors",
                sort === option.value
                  ? "font-medium text-foreground"
                  : "hover:text-foreground"
              )}
            >
              {option.label}
            </a>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Visites</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Dernière visite</TableHead>
              <TableHead>Dépenses</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => {
              const initial = (customer.name ?? customer.phone).trim().charAt(0).toUpperCase();
              return (
                <TableRow key={customer.id}>
                  <TableCell>
                    <a
                      href={`/dashboard/customers/${customer.id}`}
                      className="flex items-center gap-3 hover:underline"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-tint text-sm font-medium text-primary">
                        {initial}
                      </span>
                      <span>
                        <span className="font-medium text-foreground">
                          {customer.name ?? customer.phone}
                        </span>
                        {customer.name && (
                          <span className="block text-xs text-muted-foreground">
                            {customer.phone}
                          </span>
                        )}
                      </span>
                    </a>
                  </TableCell>
                  <TableCell>{customer.visit_count}</TableCell>
                  <TableCell>{customer.points}</TableCell>
                  <TableCell>
                    {customer.last_visit_at
                      ? customer.last_visit_at.toLocaleDateString("fr-BE")
                      : "—"}
                  </TableCell>
                  <TableCell>{formatSpend(customer.estimated_spend_cents)}</TableCell>
                  <TableCell>
                    <CustomerStatusBadge status={classifyCustomerStatus(customer)} />
                  </TableCell>
                </TableRow>
              );
            })}
            {customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
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
