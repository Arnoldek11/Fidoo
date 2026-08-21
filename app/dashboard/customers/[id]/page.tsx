import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCustomerHistory } from "@/lib/loyalty/stats";
import { logAudit } from "@/lib/audit/log";
import { DeleteCustomerButton } from "./DeleteCustomerButton";
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

  const { customer, events } = data;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            {customer.name ?? customer.phone}
          </h1>
          <p className="text-sm text-muted-foreground">
            {customer.phone} — client depuis le{" "}
            {customer.createdAt.toLocaleDateString("fr-BE")}
          </p>
        </div>
        <DeleteCustomerButton customerId={customer.id} />
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Historique
        </h2>
        <div className="space-y-2">
          {events.map((event) => {
            const meta = EVENT_META[event.type];
            const Icon = meta?.icon ?? CalendarCheck;
            return (
              <Card key={event.id}>
                <CardContent className="flex items-center justify-between py-3 text-sm">
                  <span className="flex items-center gap-2">
                    <Icon className="size-4 text-muted-foreground" />
                    {meta?.label ?? event.type}
                  </span>
                  <span className="text-muted-foreground">
                    {event.createdAt.toLocaleString("fr-BE")}
                  </span>
                </CardContent>
              </Card>
            );
          })}
          {events.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun événement.</p>
          )}
        </div>
      </div>
    </div>
  );
}
