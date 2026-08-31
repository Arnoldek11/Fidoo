import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { asEstablishmentUser } from "@/lib/db/scoped";
import { JoinQrCode } from "@/components/dashboard/qr-nfc/join-qr-code";
import { TapNfcCard } from "@/components/dashboard/qr-nfc/tap-nfc-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Printer, SmartphoneNfc, Stamp, Wallet } from "lucide-react";

const STEPS = [
  { icon: SmartphoneNfc, label: "Le client approche son téléphone" },
  { icon: Stamp, label: "Son tampon est ajouté automatiquement" },
  { icon: Wallet, label: "Sa carte se remplit jusqu'à la récompense" },
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
        <h1 className="font-heading text-2xl font-bold tracking-tight text-[#3A322B]">QR & NFC</h1>
        <p className="mt-1 font-medium text-[#8A7D6C]">
          Permettez à vos clients de rejoindre votre programme en quelques secondes.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card
          className="rounded-[22px] border-none bg-white [--card-spacing:--spacing(6)]"
          style={{ boxShadow: "0 14px 28px -10px rgba(74,64,56,0.1)" }}
        >
          <CardHeader className="border-b border-[#F6ECDD] pb-4">
            <CardTitle className="font-heading text-base font-bold text-[#3A322B]">Code QR</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <JoinQrCode establishmentId={establishmentUser.establishmentId} />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 rounded-full" disabled title="Bientôt disponible">
                <Download />
                Télécharger
              </Button>
              <Button className="flex-1 rounded-full" disabled title="Bientôt disponible">
                <Printer />
                Imprimer un poster
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card
          className="rounded-[22px] border-none bg-white [--card-spacing:--spacing(6)]"
          style={{ boxShadow: "0 14px 28px -10px rgba(74,64,56,0.1)" }}
        >
          <CardHeader className="border-b border-[#F6ECDD] pb-4">
            <CardTitle className="font-heading text-base font-bold text-[#3A322B]">
              NFC — Tap & tampon
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <TapNfcCard establishmentId={establishmentUser.establishmentId} />
          </CardContent>
        </Card>
      </div>

      <Card
        className="rounded-[22px] border-none bg-white [--card-spacing:--spacing(6)]"
        style={{ boxShadow: "0 14px 28px -10px rgba(74,64,56,0.1)" }}
      >
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.label} className="flex items-center gap-3 sm:flex-col sm:text-center">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary-tint text-primary">
                  <step.icon className="size-5" strokeWidth={2} />
                </span>
                <p className="text-sm font-medium text-[#5B4F44]">
                  <span className="font-bold text-[#3A322B]">{i + 1}.</span> {step.label}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
