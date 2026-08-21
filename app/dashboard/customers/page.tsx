import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCustomerList, type CustomerSort } from "@/lib/loyalty/stats";
import { RISK_THRESHOLD_DAYS } from "@/lib/loyalty/stats";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Clients</h1>
        <div className="flex gap-1 text-sm">
          {SORT_OPTIONS.map((option) => (
            <a
              key={option.value}
              href={`/dashboard/customers?sort=${option.value}`}
              className={cn(
                buttonVariants({
                  variant: sort === option.value ? "secondary" : "ghost",
                  size: "sm",
                })
              )}
            >
              {option.label}
            </a>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom / Téléphone</TableHead>
              <TableHead>Visites</TableHead>
              <TableHead>Dernière visite</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>
                  <a
                    href={`/dashboard/customers/${customer.id}`}
                    className="hover:underline"
                  >
                    {customer.name ?? customer.phone}
                  </a>
                  {customer.name && (
                    <span className="text-muted-foreground"> — {customer.phone}</span>
                  )}
                </TableCell>
                <TableCell>{customer.visit_count}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-2">
                    {customer.last_visit_at
                      ? customer.last_visit_at.toLocaleDateString("fr-BE")
                      : "—"}
                    {isAtRisk(customer.last_visit_at) && (
                      <Badge variant="destructive">à risque</Badge>
                    )}
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                  Aucun client pour le moment.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
