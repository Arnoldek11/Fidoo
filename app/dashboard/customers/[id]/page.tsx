import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCustomerHistory } from "@/lib/loyalty/stats";
import { logAudit } from "@/lib/audit/log";
import { DeleteCustomerButton } from "./DeleteCustomerButton";
import { ReverseVisitButton } from "./ReverseVisitButton";
import { CustomerStatusBadge } from "@/components/dashboard/customer-status-badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Coffee,
  Gift,
  Megaphone,
  TrendingUp,
  CalendarCheck,
  Undo2,
  type LucideIcon,
} from "lucide-react";

const EVENT_META: Record<string, { label: string; icon: LucideIcon }> = {
  visit: { label: "Visite", icon: CalendarCheck },
  points_added: { label: "Point ajouté", icon: Coffee },
  reward_redeemed: { label: "Récompense échangée", icon: Gift },
  points_reversed: { label: "Correction — point annulé", icon: Undo2 },
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <span
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary-tint text-xl font-bold text-primary"
            style={{ boxShadow: "0 8px 18px -6px rgba(255,90,95,0.25)" }}
          >
            {initial}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-xl font-bold text-[#3A322B]">
                {customer.name ?? customer.phone}
              </h1>
              <CustomerStatusBadge status={status} />
            </div>
            <p className="text-sm font-medium text-[#8A7D6C]">
              {customer.name && `${customer.phone} — `}Client depuis le{" "}
              {customer.createdAt.toLocaleDateString("fr-BE")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ReverseVisitButton customerId={customer.id} />
          <DeleteCustomerButton customerId={customer.id} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card
          className="rounded-[22px] border-none bg-white [--card-spacing:--spacing(5)]"
          style={{ boxShadow: "0 14px 28px -10px rgba(74,64,56,0.1)" }}
        >
          <CardContent>
            <p className="text-[13px] font-semibold text-[#8A7D6C]">Visites</p>
            <p className="font-heading mt-2 text-2xl font-bold text-[#3A322B]">{visitCount}</p>
          </CardContent>
        </Card>
        <Card
          className="rounded-[22px] border-none bg-white [--card-spacing:--spacing(5)]"
          style={{ boxShadow: "0 14px 28px -10px rgba(74,64,56,0.1)" }}
        >
          <CardContent>
            <p className="text-[13px] font-semibold text-[#8A7D6C]">Points</p>
            <p className="font-heading mt-2 text-2xl font-bold text-[#3A322B]">{points}</p>
          </CardContent>
        </Card>
        <Card
          className="rounded-[22px] border-none bg-white [--card-spacing:--spacing(5)]"
          style={{ boxShadow: "0 14px 28px -10px rgba(74,64,56,0.1)" }}
        >
          <CardContent>
            <p className="text-[13px] font-semibold text-[#8A7D6C]">Dépenses estimées</p>
            <p className="font-heading mt-2 text-2xl font-bold text-[#3A322B]">
              {formatSpend(estimatedSpendCents)}
            </p>
          </CardContent>
        </Card>
        <Card
          className="rounded-[22px] border-none bg-white [--card-spacing:--spacing(5)]"
          style={{ boxShadow: "0 14px 28px -10px rgba(74,64,56,0.1)" }}
        >
          <CardContent>
            <p className="text-[13px] font-semibold text-[#8A7D6C]">Dernière visite</p>
            <p className="font-heading mt-2 text-2xl font-bold text-[#3A322B]">
              {lastVisitAt ? lastVisitAt.toLocaleDateString("fr-BE") : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card
        className="rounded-[24px] border-none bg-white [--card-spacing:--spacing(5.5)]"
        style={{ boxShadow: "0 14px 28px -10px rgba(74,64,56,0.1)" }}
      >
        <CardHeader>
          <CardTitle className="font-heading text-base font-bold text-[#3A322B]">
            Historique
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timelineEvents.length === 0 ? (
            <p className="py-6 text-center text-sm font-medium text-[#8A7D6C]">
              Aucun événement.
            </p>
          ) : (
            <ul className="divide-y divide-[#F6ECDD]">
              {timelineEvents.map((event) => {
                const meta = EVENT_META[event.type];
                const Icon = meta?.icon ?? CalendarCheck;
                return (
                  <li
                    key={event.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary-tint text-primary">
                        <Icon className="size-4" strokeWidth={2} />
                      </span>
                      <span className="text-sm font-semibold text-[#3A322B]">
                        {meta?.label ?? event.type}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-medium text-[#B0A290]">
                      {event.createdAt.toLocaleString("fr-BE")}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
