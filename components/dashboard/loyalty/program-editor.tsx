"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ColorField, CARD_COLOR_PRESETS, TEXT_COLOR_PRESETS } from "@/components/color-field";
import { StampProgress } from "@/components/loyalty/stamp-progress";
import { STAMP_ICONS } from "@/components/loyalty/stamp-icons";
import { cn } from "@/lib/utils";
import type { ProgramSettings } from "@/lib/loyalty/program";
import { saveProgram } from "@/app/dashboard/loyalty/actions";

const GOAL_CHOICES = [6, 8, 10, 12];

export function ProgramEditor({
  initial,
  establishmentName,
}: {
  initial: ProgramSettings;
  establishmentName: string;
}) {
  const [program, setProgram] = useState<ProgramSettings>(initial);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof ProgramSettings>(key: K, value: ProgramSettings[K]) {
    setProgram((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await saveProgram(program);
      if (result.status === "invalid") {
        setError(result.message);
      } else {
        setProgram(result.program);
        setSaved(true);
      }
    });
  }

  const previewBalance = Math.max(1, program.goal - 3);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card
        className="rounded-[22px] border-none bg-white [--card-spacing:--spacing(6)]"
        style={{ boxShadow: "0 14px 28px -10px rgba(74,64,56,0.1)" }}
      >
        <CardHeader className="border-b border-[#F6ECDD] pb-4">
          <CardTitle className="font-heading text-base font-bold text-[#3A322B]">
            Personnaliser la carte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <div className="space-y-1.5">
            <Label>Tampons pour la récompense</Label>
            <div className="flex gap-2">
              {GOAL_CHOICES.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  onClick={() => update("goal", choice)}
                  className={cn(
                    "flex-1 rounded-full py-2 text-sm font-bold transition-colors",
                    program.goal === choice
                      ? "bg-primary text-primary-foreground"
                      : "bg-[#F6ECDD] text-[#5B4F44] hover:bg-[#F0E3CE]"
                  )}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reward-label">Récompense</Label>
            <Input
              id="reward-label"
              value={program.rewardLabel}
              maxLength={60}
              onChange={(e) => update("rewardLabel", e.target.value)}
              placeholder="ex : un café offert"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ColorField
              label="Couleur de la carte"
              value={program.cardColor}
              presets={CARD_COLOR_PRESETS}
              onChange={(value) => update("cardColor", value)}
            />
            <ColorField
              label="Couleur du texte"
              value={program.textColor}
              presets={TEXT_COLOR_PRESETS}
              onChange={(value) => update("textColor", value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Icône des tampons</Label>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(STAMP_ICONS).map(([name, { icon: Icon, label }]) => (
                <button
                  key={name}
                  type="button"
                  title={label}
                  aria-label={label}
                  onClick={() => update("stampIcon", name)}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-2xl transition-colors",
                    program.stampIcon === name
                      ? "bg-primary-tint text-primary ring-2 ring-primary"
                      : "bg-[#F6ECDD] text-[#8A7D6C] hover:bg-[#F0E3CE]"
                  )}
                >
                  <Icon className="size-5" strokeWidth={2} />
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm font-medium text-error">{error}</p>}

          <Button className="w-full rounded-full" onClick={handleSave} disabled={isPending}>
            {saved ? <Check /> : null}
            {isPending ? "Enregistrement…" : saved ? "Enregistré !" : "Enregistrer"}
          </Button>
          <p className="text-center text-xs font-medium text-[#B0A290]">
            Appliqué immédiatement à toutes les cartes clients et à la page de tap.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card
          className="rounded-[22px] border-none bg-white [--card-spacing:--spacing(6)]"
          style={{ boxShadow: "0 14px 28px -10px rgba(74,64,56,0.1)" }}
        >
          <CardHeader className="border-b border-[#F6ECDD] pb-4">
            <CardTitle className="font-heading text-base font-bold text-[#3A322B]">
              Aperçu en direct
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div
              className="mx-auto w-full max-w-xs overflow-hidden rounded-[24px] bg-white"
              style={{ boxShadow: "0 14px 28px -10px rgba(74,64,56,0.14)" }}
            >
              <div
                className="px-6 py-5 text-center"
                style={{ backgroundColor: program.cardColor, color: program.textColor }}
              >
                <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
                  {establishmentName}
                </p>
                <p className="font-heading mt-1 text-lg font-bold">Votre client</p>
              </div>
              <div className="p-6">
                <StampProgress
                  balance={previewBalance}
                  goal={program.goal}
                  rewardLabel={program.rewardLabel || "récompense"}
                  icon={program.stampIcon}
                  accentColor={program.cardColor}
                />
              </div>
            </div>
            <p className="mt-4 text-center text-xs font-medium text-[#B0A290]">
              Exactement ce que vos clients voient sur leur carte et après un tap.
            </p>
          </CardContent>
        </Card>

        <Card
          className="rounded-[22px] border-none bg-white [--card-spacing:--spacing(6)]"
          style={{ boxShadow: "0 14px 28px -10px rgba(74,64,56,0.1)" }}
        >
          <CardHeader className="border-b border-[#F6ECDD] pb-4">
            <CardTitle className="font-heading text-base font-bold text-[#3A322B]">
              Règles du programme
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-center justify-between rounded-2xl bg-[#F6ECDD] px-4 py-3">
              <span className="text-sm font-medium text-[#5B4F44]">1 visite</span>
              <span className="text-sm font-bold text-[#3A322B]">= 1 tampon</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-[#F6ECDD] px-4 py-3">
              <span className="text-sm font-medium text-[#5B4F44]">{program.goal} tampons</span>
              <span className="text-sm font-bold text-[#3A322B]">
                = {program.rewardLabel || "récompense"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
