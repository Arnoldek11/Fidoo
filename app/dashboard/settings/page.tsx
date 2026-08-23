import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { asEstablishmentUser } from "@/lib/db/scoped";
import { createCheckoutSession, createPortalSession } from "./actions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, CheckCircle2 } from "lucide-react";

const BILLING_STATUS_LABELS: Record<string, { label: string; className: string }> = {
  active: { label: "Actif", className: "bg-success-bg text-success" },
  trialing: { label: "Période d'essai", className: "bg-primary-tint text-primary" },
  past_due: { label: "Paiement en retard", className: "bg-warning-bg text-warning" },
  canceled: { label: "Annulé", className: "bg-muted text-muted-foreground" },
  incomplete: { label: "Incomplet", className: "bg-warning-bg text-warning" },
  incomplete_expired: { label: "Expiré", className: "bg-muted text-muted-foreground" },
  unpaid: { label: "Impayé", className: "bg-error-bg text-error" },
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { checkout } = await searchParams;

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

  const { establishment } = establishmentUser;
  const isPaid = establishment.plan === "standard";
  const statusInfo = establishment.billingStatus
    ? BILLING_STATUS_LABELS[establishment.billingStatus]
    : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-[#3A322B]">Paramètres</h1>
        <p className="mt-1 font-medium text-[#8A7D6C]">Facturation et abonnement.</p>
      </div>

      {checkout === "success" && (
        <div className="flex items-center gap-2 rounded-2xl bg-success-bg px-4 py-3 text-sm font-semibold text-success">
          <CheckCircle2 className="size-4 shrink-0" />
          Abonnement activé — merci !
        </div>
      )}
      {checkout === "cancelled" && (
        <div className="rounded-2xl bg-[#F6ECDD] px-4 py-3 text-sm font-medium text-[#8A7D6C]">
          Paiement annulé — vous pouvez réessayer à tout moment.
        </div>
      )}

      <Card
        className="max-w-xl rounded-[22px] border-none bg-white [--card-spacing:--spacing(6)]"
        style={{ boxShadow: "0 14px 28px -10px rgba(74,64,56,0.1)" }}
      >
        <CardHeader className="flex-row items-center gap-3 border-b border-[#F6ECDD] pb-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary-tint text-primary">
            <CreditCard className="size-5" strokeWidth={2} />
          </span>
          <CardTitle className="font-heading text-base font-bold text-[#3A322B]">
            Abonnement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <div className="flex items-center justify-between rounded-2xl bg-[#F6ECDD] px-4 py-3">
            <span className="text-sm font-medium text-[#5B4F44]">
              {isPaid ? "Plan Standard — 49€/mois" : "Plan pilote (gratuit)"}
            </span>
            {statusInfo && (
              <Badge className={`border-transparent ${statusInfo.className}`}>
                {statusInfo.label}
              </Badge>
            )}
          </div>

          {isPaid ? (
            <form action={createPortalSession}>
              <Button type="submit" className="w-full rounded-full">
                Gérer mon abonnement
              </Button>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-[#8A7D6C]">
                Passez au plan Standard (49€/mois) pour continuer après la période pilote.
              </p>
              <form action={createCheckoutSession}>
                <Button
                  type="submit"
                  className="w-full rounded-full shadow-[0_8px_18px_rgba(255,90,95,0.32)]"
                >
                  Passer au plan payant
                </Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
