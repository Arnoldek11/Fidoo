"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Gift, Nfc, PartyPopper, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { StampProgress } from "@/components/loyalty/stamp-progress";
import { tapAsKnownCustomer, joinAndTap, type TapActionResult } from "./actions";

type CardResult = Extract<TapActionResult, { status: "stamped" | "cooldown" }>;

function formatRetryTime(iso: string | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" });
}

export function TapExperience({
  establishmentId,
  establishmentName,
  hasKnownCard,
}: {
  establishmentId: string;
  establishmentName: string;
  hasKnownCard: boolean;
}) {
  const [phase, setPhase] = useState<"stamping" | "form" | "result" | "error">(
    hasKnownCard ? "stamping" : "form"
  );
  const [result, setResult] = useState<CardResult | null>(null);
  // The just-earned stamp is revealed a beat after the card appears, so the
  // customer actually sees it land.
  const [revealed, setRevealed] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [isPending, startTransition] = useTransition();
  const tappedOnce = useRef(false);

  function handleResult(actionResult: TapActionResult) {
    if (actionResult.status === "unknown") {
      setPhase("form");
      return;
    }
    if (actionResult.status === "invalid") {
      setFormError(actionResult.message);
      setPhase(phase === "stamping" ? "error" : "form");
      return;
    }
    setResult(actionResult);
    setRevealed(actionResult.status !== "stamped");
    setPhase("result");
    if (actionResult.status === "stamped") {
      setTimeout(() => setRevealed(true), 500);
    }
  }

  useEffect(() => {
    // Guarded ref: React Strict Mode double-mounts effects in dev, and one
    // physical tap must never fire the action twice.
    if (!hasKnownCard || tappedOnce.current) return;
    tappedOnce.current = true;
    startTransition(async () => {
      try {
        handleResult(await tapAsKnownCustomer(establishmentId));
      } catch {
        setPhase("error");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    startTransition(async () => {
      try {
        handleResult(
          await joinAndTap(establishmentId, {
            phone,
            name: name.trim() === "" ? undefined : name.trim(),
            consent,
          })
        );
      } catch {
        setFormError("Une erreur est survenue. Réessayez.");
      }
    });
  }

  const displayBalance =
    result === null ? 0 : result.status === "stamped" && !revealed ? result.balance - 1 : result.balance;
  const rewardReached = result !== null && result.status === "stamped" && result.balance >= result.goal;
  const retryTime = result?.status === "cooldown" ? formatRetryTime(result.retryAfter) : null;

  return (
    <div className="flex min-h-screen flex-col px-6 py-10" style={{ background: "#FBF6EF" }}>
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
        {phase === "stamping" && (
          <div className="text-center">
            <span
              className="mx-auto flex size-20 animate-pulse items-center justify-center rounded-full bg-primary text-primary-foreground"
              style={{ boxShadow: "0 14px 28px -10px rgba(255,90,95,0.45)" }}
            >
              <Nfc className="size-9" strokeWidth={2} />
            </span>
            <p className="mt-5 font-heading text-lg font-bold text-[#3A322B]">Tampon en cours…</p>
            <p className="mt-1 text-sm font-medium text-[#8A7D6C]">{establishmentName}</p>
          </div>
        )}

        {phase === "form" && (
          <div>
            <div className="text-center">
              <span
                className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary-tint text-2xl font-bold text-primary"
                style={{ boxShadow: "0 8px 18px -6px rgba(255,90,95,0.25)" }}
              >
                {establishmentName.trim().charAt(0).toUpperCase()}
              </span>
              <p className="mt-3 text-sm font-semibold text-[#8A7D6C]">{establishmentName}</p>
              <h1 className="mt-5 font-heading text-2xl font-bold text-[#3A322B]">
                Votre premier tampon vous attend
              </h1>
              <p className="mt-2 font-medium text-[#8A7D6C]">
                Indiquez votre numéro, c&apos;est tout.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-3 rounded-[24px] bg-white p-6"
              style={{ boxShadow: "0 14px 28px -10px rgba(74,64,56,0.1)" }}
            >
              <Input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Numéro de téléphone"
              />
              <Input
                type="text"
                autoComplete="given-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Prénom (optionnel)"
              />
              <Label className="flex items-start gap-2 text-sm font-normal text-[#5B4F44]">
                <Checkbox
                  checked={consent}
                  onCheckedChange={(checked) => setConsent(checked === true)}
                  className="mt-0.5"
                />
                <span>
                  J&apos;accepte de recevoir des offres (SMS) de {establishmentName}. Optionnel.
                </span>
              </Label>
              {formError && <p className="text-sm font-medium text-error">{formError}</p>}
              <Button type="submit" className="w-full rounded-full" disabled={isPending}>
                {isPending ? "Un instant…" : "Recevoir mon premier tampon"}
              </Button>
              <p className="text-center text-xs font-medium text-[#B0A290]">
                Gratuit · Aucun téléchargement ·{" "}
                <a href="/legal/privacy" className="underline underline-offset-2">
                  Confidentialité
                </a>
              </p>
            </form>
          </div>
        )}

        {phase === "result" && result && (
          <div className="text-center">
            {rewardReached ? (
              <>
                <p
                  className="flex items-center justify-center gap-2 font-heading text-2xl font-bold text-primary"
                  style={{ color: result.cardColor }}
                >
                  <PartyPopper className="size-6" />
                  Récompense débloquée !
                </p>
                <p className="mt-1.5 text-sm font-medium text-[#8A7D6C]">
                  Montrez cet écran au comptoir pour en profiter.
                </p>
              </>
            ) : result.status === "stamped" ? (
              <>
                <p className="font-heading text-2xl font-bold text-[#3A322B]">+1 tampon !</p>
                <p className="mt-1.5 text-sm font-medium text-[#8A7D6C]">
                  Merci de votre visite chez {result.establishmentName}.
                </p>
              </>
            ) : (
              <>
                <p className="flex items-center justify-center gap-2 font-heading text-xl font-bold text-[#3A322B]">
                  <Clock className="size-5 text-[#8A7D6C]" />
                  Visite déjà comptée
                </p>
                <p className="mt-1.5 text-sm font-medium text-[#8A7D6C]">
                  Un tampon par visite{retryTime ? ` — revenez après ${retryTime}` : ""}.
                </p>
              </>
            )}

            <div
              className="mt-6 w-full overflow-hidden rounded-[24px] bg-white text-left animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ boxShadow: "0 14px 28px -10px rgba(74,64,56,0.14)" }}
            >
              <div
                className="px-6 py-5 text-center"
                style={{ backgroundColor: result.cardColor, color: result.textColor }}
              >
                <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
                  {result.establishmentName}
                </p>
                {result.name && (
                  <p className="font-heading mt-1 text-lg font-bold">{result.name}</p>
                )}
              </div>
              <div className="p-6">
                <StampProgress
                  balance={displayBalance}
                  goal={result.goal}
                  rewardLabel={result.rewardLabel}
                  icon={result.stampIcon}
                  accentColor={result.cardColor}
                  popIndex={result.status === "stamped" ? result.balance - 1 : undefined}
                />
              </div>
            </div>

            <Button
              className="mt-6 w-full rounded-full"
              nativeButton={false}
              render={<a href={`/card/${result.customerId}`} />}
            >
              <Gift />
              Voir ma carte
            </Button>
            <p className="mt-3 text-xs font-medium text-[#B0A290]">
              Astuce : ajoutez votre carte à l&apos;écran d&apos;accueil pour la retrouver en un
              geste.
            </p>
          </div>
        )}

        {phase === "error" && (
          <div className="text-center">
            <p className="font-heading text-xl font-bold text-[#3A322B]">
              Oups, le tampon n&apos;est pas passé
            </p>
            <p className="mt-1.5 text-sm font-medium text-[#8A7D6C]">
              Vérifiez votre connexion puis réessayez.
            </p>
            <Button
              className="mt-6 rounded-full"
              disabled={isPending}
              onClick={() => {
                setPhase("stamping");
                startTransition(async () => {
                  try {
                    handleResult(await tapAsKnownCustomer(establishmentId));
                  } catch {
                    setPhase("error");
                  }
                });
              }}
            >
              Réessayer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
