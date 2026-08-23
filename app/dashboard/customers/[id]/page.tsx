import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCustomerHistory } from "@/lib/loyalty/stats";
import { logAudit } from "@/lib/audit/log";
import { DeleteCustomerButton } from "./DeleteCustomerButton";
import { CustomerStatusBadge } from "@/components/dashboard/customer-status-badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Coffee,
  Gift,
  Megaphone,
  TrendingUp,
  CalendarCheck,
  type LucideIcon,
} from "lucide-react";

const EVENT_META: Record<string, { label: string; icon: LucideIcon }> = {
  visit: { label: "Visite", icon: CalendarCheck },
  points_added: { label: "Point ajouté", icon: Coffee },
  reward_redeemed: { label: "Récompense échangée", icon: Gift },
  campaign_sent: { label: "Campagne envoyée", icon: Megaphone },
  attributed_return: { label: "Retour attribué à une campagne", icon: TrendingUp },
};

function formatSpend(cents: number | null) {
  if (cents === null) return "—";
  return `${(cents / 100).toLocaleString("fr-BE", { maximumFractionDigits: 0 })} €`;
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getCustomerHistory(user.id, id);
  if (!data) notFound();

  await logAudit(user.id, "viewed_customer", "customer", id);

  const { customer, events, visitCount, lastVisitAt, points, estimatedSpendCents, status } = data;
  const initial = (customer.name ?? customer.phone).trim().charAt(0).toUpperCase();
  const timelineEvents = [...events].reverse();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary-tint text-xl font-semibold text-primary">
            {initial}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground">
                {customer.name ?? customer.phone}
              </h1>
              <CustomerStatusBadge status={status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {customer.name && `${customer.phone} — `}Client depuis le{" "}
              {customer.createdAt.toLocaleDateString("fr-BE")}
            </p>
          </div>
        </div>
        <DeleteCustomerButton customerId={customer.id} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <CardContent>
            <p className="text-sm text-muted-foreground">Visites</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{visitCount}</p>
          </CardContent>
        </Card>
        <Card className="border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <CardContent>
            <p className="text-sm text-muted-foreground">Points</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{points}</p>
          </CardContent>
        </Card>
        <Card className="border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <CardContent>
            <p className="text-sm text-muted-foreground">Dépenses estimées</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {formatSpend(estimatedSpendCents)}
            </p>
          </CardContent>
        </Card>
        <Card className="border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <CardContent>
            <p className="text-sm text-muted-foreground">Dernière visite</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {lastVisitAt ? lastVisitAt.toLocaleDateString("fr-BE") : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">Historique</h2>
        <div className="space-y-2">
          {timelineEvents.map((event) => {
            const meta = EVENT_META[event.type];
            const Icon = meta?.icon ?? CalendarCheck;
            return (
              <Card key={event.id} className="border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <CardContent className="flex items-center justify-between py-3 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-tint text-primary">
                      <Icon className="size-3.5" strokeWidth={1.75} />
                    </span>
                    {meta?.label ?? event.type}
                  </span>
                  <span className="text-muted-foreground">
                    {event.createdAt.toLocaleString("fr-BE")}
                  </span>
                </CardContent>
              </Card>
            );
          })}
          {timelineEvents.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun événement.</p>
          )}
        </div>
      </div>
    </div>
  );
}
