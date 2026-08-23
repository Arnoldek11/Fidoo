import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { asEstablishmentUser } from "@/lib/db/scoped";
import { JoinQrCode } from "@/components/dashboard/qr-nfc/join-qr-code";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Printer, Nfc, SmartphoneNfc, Wallet, UserCheck } from "lucide-react";

const STEPS = [
  { icon: SmartphoneNfc, label: "Approchez le téléphone" },
  { icon: Wallet, label: "La carte s'ouvre" },
  { icon: UserCheck, label: "Le client rejoint Fidoo" },
];

export default async function QrNfcPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const establishmentUser = await asEstablishmentUser(user.id, (tx) =>
    tx.establishmentUser.findUnique({ where: { id: user.id } })
  );
  if (!establishmentUser) redirect("/login?error=no-establishment");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">QR & NFC</h1>
        <p className="mt-1 text-muted-foreground">
          Permettez à vos clients de rejoindre votre programme en quelques secondes.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] [--card-spacing:--spacing(6)]">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-base">Code QR</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <JoinQrCode establishmentId={establishmentUser.establishmentId} />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" disabled title="Bientôt disponible">
                <Download />
                Télécharger
              </Button>
              <Button className="flex-1" disabled title="Bientôt disponible">
                <Printer />
                Imprimer un poster
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] [--card-spacing:--spacing(6)]">
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-base">NFC</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center gap-3 rounded-[10px] bg-muted p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-background text-muted-foreground">
                <Nfc className="size-5" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">Aucun tag configuré</p>
                <p className="text-xs text-muted-foreground">Approchez un tag pour commencer</p>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Identifiant du tag</dt>
                <dd className="mt-0.5 font-medium text-foreground">—</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Dernier scan</dt>
                <dd className="mt-0.5 font-medium text-foreground">—</dd>
              </div>
            </dl>
            <Button className="w-full" disabled title="Bientôt disponible">
              Configurer un nouveau tag
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] [--card-spacing:--spacing(6)]">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.label} className="flex items-center gap-3 sm:flex-col sm:text-center">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-tint text-primary">
                  <step.icon className="size-5" strokeWidth={1.75} />
                </span>
                <p className="text-sm text-foreground">
                  <span className="font-medium">{i + 1}.</span> {step.label}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
