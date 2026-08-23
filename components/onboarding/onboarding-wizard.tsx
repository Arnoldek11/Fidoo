"use client";

import { useState } from "react";
import { Logo } from "@/components/logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LogoUploadField } from "@/components/logo-upload-field";
import { ColorField, CARD_COLOR_PRESETS } from "@/components/color-field";
import { WalletCard } from "@/components/wallet-card";
import { PhoneFrame } from "@/components/phone-frame";
import { JoinQrCode } from "@/components/dashboard/qr-nfc/join-qr-code";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Download, Nfc } from "lucide-react";

const STEP_COUNT = 5;

const REWARD_PRESETS = [
  { id: "coffee", threshold: "10 visites", reward: "1 café offert" },
  { id: "discount", threshold: "100 points", reward: "10€ de réduction" },
  { id: "dessert", threshold: "5 commandes", reward: "1 dessert offert" },
] as const;

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: STEP_COUNT }, (_, i) => (
        <span
          key={i}
          className={cn("size-2 rounded-full", i + 1 <= current ? "bg-primary" : "bg-[#F0E4D3]")}
        />
      ))}
    </div>
  );
}

export function OnboardingWizard({
  establishmentName,
  establishmentId,
}: {
  establishmentName: string;
  establishmentId: string;
}) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(establishmentName);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [rewardPresetId, setRewardPresetId] = useState<(typeof REWARD_PRESETS)[number]["id"]>(
    "coffee"
  );
  const [cardColor, setCardColor] = useState("#FF5A5F");

  const rewardPreset = REWARD_PRESETS.find((r) => r.id === rewardPresetId)!;
  const rewardText = `${rewardPreset.threshold} = ${rewardPreset.reward}`;

  return (
    <div
      className="mx-auto flex min-h-screen max-w-2xl flex-col px-6 py-10"
      style={{ background: "#FBF6EF" }}
    >
      <div className="flex items-center justify-between">
        <Logo className="h-4 w-auto" />
        <StepDots current={step} />
      </div>

      <div className="flex flex-1 flex-col justify-center py-12">
        {step === 1 && (
          <div className="space-y-6 text-center">
            <div>
              <h1 className="font-heading text-2xl font-bold text-[#3A322B]">Bienvenue sur Fidoo 👋</h1>
              <p className="mt-2 font-medium text-[#8A7D6C]">
                Configurons votre programme de fidélité en quelques minutes.
              </p>
            </div>
            <div className="mx-auto max-w-sm space-y-1.5 text-left">
              <Label htmlFor="establishment-name">Nom de votre établissement</Label>
              <Input
                id="establishment-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 text-center">
            <div>
              <h1 className="font-heading text-2xl font-bold text-[#3A322B]">Ajoutez votre logo</h1>
              <p className="mt-2 font-medium text-[#8A7D6C]">
                Il apparaîtra sur la carte de vos clients.
              </p>
            </div>
            <div className="mx-auto max-w-sm text-left">
              <LogoUploadField
                logoDataUrl={logoDataUrl}
                onChange={setLogoDataUrl}
                label="Logo de l'établissement"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 text-center">
            <div>
              <h1 className="font-heading text-2xl font-bold text-[#3A322B]">
                Que souhaitez-vous offrir ?
              </h1>
              <p className="mt-2 font-medium text-[#8A7D6C]">
                Choisissez la récompense qui donnera envie à vos clients de revenir.
              </p>
            </div>
            <div className="mx-auto grid max-w-xl gap-3 text-left sm:grid-cols-3">
              {REWARD_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setRewardPresetId(preset.id)}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition-all",
                    rewardPresetId === preset.id
                      ? "border-primary bg-primary-tint"
                      : "border-transparent bg-white hover:bg-[#FFF8F0]"
                  )}
                  style={
                    rewardPresetId === preset.id
                      ? { boxShadow: "0 8px 18px -6px rgba(255,90,95,0.25)" }
                      : { boxShadow: "0 4px 12px -4px rgba(74,64,56,0.08)" }
                  }
                >
                  <p className="text-sm font-bold text-[#3A322B]">{preset.threshold}</p>
                  <p className="mt-1 text-sm font-medium text-[#8A7D6C]">{preset.reward}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="font-heading text-2xl font-bold text-[#3A322B]">Personnalisez votre carte</h1>
              <p className="mt-2 font-medium text-[#8A7D6C]">
                Vos clients la garderont dans leur Apple ou Google Wallet.
              </p>
            </div>
            <div className="mx-auto grid max-w-xl grid-cols-1 items-center gap-8 sm:grid-cols-2">
              <div className="mx-auto sm:mx-0">
                <ColorField
                  label="Couleur de la carte"
                  value={cardColor}
                  presets={CARD_COLOR_PRESETS}
                  onChange={setCardColor}
                />
              </div>
              <PhoneFrame>
                <WalletCard
                  data={{
                    name,
                    logoDataUrl,
                    cardColor,
                    textColor: "#FFFFFF",
                    message: "Merci de votre fidélité !",
                    rewardText,
                  }}
                  variant="apple"
                />
              </PhoneFrame>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6 text-center">
            <div>
              <h1 className="font-heading text-2xl font-bold text-[#3A322B]">
                Votre programme est prêt 🎉
              </h1>
              <p className="mt-2 font-medium text-[#8A7D6C]">
                Affichez ce code pour que vos premiers clients rejoignent {name || "votre programme"}.
              </p>
            </div>
            <div className="mx-auto max-w-xs">
              <JoinQrCode establishmentId={establishmentId} />
            </div>
            <div className="mx-auto flex max-w-sm flex-col gap-2">
              <Button disabled title="Bientôt disponible" className="rounded-full">
                <Download />
                Télécharger mon QR
              </Button>
              <Button
                variant="outline"
                className="rounded-full"
                nativeButton={false}
                render={<a href="/dashboard/qr-nfc" />}
              >
                <Nfc />
                Configurer NFC
              </Button>
              <Button
                variant="outline"
                className="rounded-full"
                nativeButton={false}
                render={<a href="/dashboard" />}
              >
                Voir mon dashboard
              </Button>
            </div>
          </div>
        )}
      </div>

      {step < 5 && (
        <div className="flex items-center justify-between">
          {step > 1 ? (
            <Button variant="outline" className="rounded-full" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft />
              Retour
            </Button>
          ) : (
            <span />
          )}
          <Button
            className="rounded-full px-4 shadow-[0_8px_18px_rgba(255,90,95,0.32)]"
            onClick={() => setStep((s) => s + 1)}
          >
            Continuer
            <ArrowRight />
          </Button>
        </div>
      )}
    </div>
  );
}
