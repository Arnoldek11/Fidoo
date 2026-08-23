"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import {
  verifyPin,
  staffLookupCustomer,
  staffValidateVisit,
  staffRegisterAndValidate,
  type StaffCustomerLookupResult,
  type StaffValidateResult,
} from "./actions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Camera, CheckCircle2, Clock, RotateCcw, Search, UserPlus, LogOut } from "lucide-react";

const SCANNER_ELEMENT_ID = "staff-qr-scanner";

type Html5QrcodeInstance = {
  start: (
    cameraConfig: { facingMode: string },
    scanConfig: { fps: number; qrbox: number },
    onSuccess: (decodedText: string) => void,
    onFailure: (error: string) => void
  ) => Promise<void>;
  stop: () => Promise<void>;
};

type ActiveStaff = { id: string; name: string };

export function StaffConsole({
  establishmentId,
  establishmentName,
  staff,
}: {
  establishmentId: string;
  establishmentName: string;
  staff: { id: string; name: string }[];
}) {
  const [activeStaff, setActiveStaff] = useState<ActiveStaff | null>(null);

  return (
    <div className="min-h-screen p-4" style={{ background: "#FBF6EF" }}>
      <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="font-heading text-xl font-bold text-[#3A322B]">{establishmentName} — Comptoir</h1>
        {activeStaff && <p className="text-sm font-medium text-[#8A7D6C]">Connecté : {activeStaff.name}</p>}
      </div>

      {!activeStaff ? (
        <PinPad staff={staff} establishmentId={establishmentId} onVerified={setActiveStaff} />
      ) : (
        <ValidateConsole
          establishmentId={establishmentId}
          staffId={activeStaff.id}
          onSwitchEmployee={() => setActiveStaff(null)}
        />
      )}
      </div>
    </div>
  );
}

function PinPad({
  staff,
  establishmentId,
  onVerified,
}: {
  staff: { id: string; name: string }[];
  establishmentId: string;
  onVerified: (staff: ActiveStaff) => void;
}) {
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const ok = await verifyPin(establishmentId, selected.id, pin);
      if (ok) {
        onVerified(selected);
      } else {
        setError("PIN incorrect.");
        setPin("");
      }
    });
  }

  if (staff.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Aucun employé n&apos;est configuré. Ajoutez votre équipe depuis le tableau de bord
          (Équipe) avant d&apos;utiliser le comptoir.
        </AlertDescription>
      </Alert>
    );
  }

  if (!selected) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {staff.map((s) => (
          <Button
            key={s.id}
            variant="outline"
            className="h-16 rounded-2xl bg-white text-base font-semibold text-[#3A322B]"
            style={{ boxShadow: "0 4px 12px -4px rgba(74,64,56,0.08)" }}
            onClick={() => setSelected(s)}
          >
            {s.name}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <Card
      className="rounded-[22px] border-none bg-white"
      style={{ boxShadow: "0 14px 28px -10px rgba(74,64,56,0.1)" }}
    >
      <CardContent className="space-y-4 pt-6">
        <p className="text-sm font-semibold text-[#3A322B]">{selected.name} — entrez votre code</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="password"
            inputMode="numeric"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Code PIN"
            className="text-center text-lg tracking-widest"
          />
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-full"
              onClick={() => {
                setSelected(null);
                setPin("");
                setError(null);
              }}
            >
              Retour
            </Button>
            <Button type="submit" className="flex-1 rounded-full" disabled={isPending || pin.length < 4}>
              Valider
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ValidateConsole({
  establishmentId,
  staffId,
  onSwitchEmployee,
}: {
  establishmentId: string;
  staffId: string;
  onSwitchEmployee: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [lookup, setLookup] = useState<StaffCustomerLookupResult | null>(null);
  const [result, setResult] = useState<StaffValidateResult | null>(null);
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [cameraStatus, setCameraStatus] = useState<"loading" | "ready" | "unavailable">("loading");

  const scannerRef = useRef<Html5QrcodeInstance | null>(null);
  const scanLockedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (cancelled) return;
      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID) as unknown as Html5QrcodeInstance;
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          (decodedText) => {
            if (scanLockedRef.current) return;
            scanLockedRef.current = true;
            setPhone(decodedText);
            runLookup(decodedText);
          },
          () => {
            // per-frame "no QR found" — expected constantly, not an error
          }
        )
        .then(() => !cancelled && setCameraStatus("ready"))
        .catch(() => !cancelled && setCameraStatus("unavailable"));
    });

    return () => {
      cancelled = true;
      scannerRef.current?.stop().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function runLookup(value: string) {
    setError(null);
    setResult(null);
    startTransition(async () => {
      const res = await staffLookupCustomer(establishmentId, value);
      if (res.status === "invalid") {
        setError(res.message);
        setLookup(null);
        scanLockedRef.current = false;
      } else {
        setLookup(res);
      }
    });
  }

  function handleManualSubmit(e: FormEvent) {
    e.preventDefault();
    scanLockedRef.current = true;
    runLookup(phone);
  }

  function handleRecordVisit(customerId: string) {
    startTransition(async () => {
      const res = await staffValidateVisit(establishmentId, staffId, customerId);
      setResult(res);
      setLookup(null);
    });
  }

  function handleRegister(e: FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await staffRegisterAndValidate(establishmentId, staffId, {
        phone,
        name: name || undefined,
        consent,
      });
      if (res.status === "invalid") {
        setError(res.message);
      } else {
        setResult(res);
        setLookup(null);
      }
    });
  }

  function reset() {
    setPhone("");
    setLookup(null);
    setResult(null);
    setName("");
    setConsent(false);
    setError(null);
    scanLockedRef.current = false;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" className="rounded-full text-[#8A7D6C]" onClick={onSwitchEmployee}>
          <LogOut className="size-4" />
          Changer d&apos;employé
        </Button>
      </div>

      <Card
        className="overflow-hidden rounded-[22px] border-none bg-white py-0"
        style={{ boxShadow: "0 14px 28px -10px rgba(74,64,56,0.1)" }}
      >
        <div id={SCANNER_ELEMENT_ID} className="aspect-square w-full bg-[#F6ECDD]" />
        {cameraStatus !== "ready" && (
          <CardContent className="flex items-center gap-2 py-3 text-sm font-medium text-[#8A7D6C]">
            <Camera className="size-4 shrink-0" />
            {cameraStatus === "loading"
              ? "Activation de la caméra…"
              : "Caméra indisponible — utilisez la saisie manuelle ci-dessous."}
          </CardContent>
        )}
      </Card>

      <form onSubmit={handleManualSubmit} className="flex gap-2">
        <Input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Numéro de téléphone"
          required
        />
        <Button type="submit" className="rounded-full" disabled={isPending}>
          <Search />
          Rechercher
        </Button>
      </form>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {lookup?.status === "found" && (
        <Card
          className="rounded-[22px] border-none bg-white"
          style={{ boxShadow: "0 14px 28px -10px rgba(74,64,56,0.1)" }}
        >
          <CardContent className="space-y-3">
            <p className="text-sm font-semibold text-[#3A322B]">
              {lookup.name ?? "Client"} — {lookup.balance} point
              {lookup.balance > 1 ? "s" : ""}
            </p>
            <Button
              className="w-full rounded-full"
              onClick={() => handleRecordVisit(lookup.customerId)}
              disabled={isPending}
            >
              Enregistrer la visite
            </Button>
          </CardContent>
        </Card>
      )}

      {lookup?.status === "not_found" && (
        <Card
          className="rounded-[22px] border-none bg-white"
          style={{ boxShadow: "0 14px 28px -10px rgba(74,64,56,0.1)" }}
        >
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-3">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-[#8A7D6C]">
                <UserPlus className="size-4" />
                Nouveau client — {phone}
              </p>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom (optionnel)"
              />
              <Label className="flex items-start gap-2 text-sm font-normal">
                <Checkbox
                  checked={consent}
                  onCheckedChange={(checked) => setConsent(checked === true)}
                  className="mt-0.5"
                />
                <span>
                  Le client accepte de recevoir des communications (SMS) de cet
                  établissement.
                </span>
              </Label>
              <Button type="submit" className="w-full rounded-full" disabled={isPending}>
                Inscrire et enregistrer la visite
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {result?.status === "cooldown" && (
        <Alert>
          <Clock className="size-4" />
          <AlertDescription>
            Ce client a déjà été crédité récemment — nouvelle visite possible après{" "}
            {new Date(result.retryAfter).toLocaleTimeString("fr-BE", {
              hour: "2-digit",
              minute: "2-digit",
            })}
            .
          </AlertDescription>
        </Alert>
      )}

      {result?.status === "ok" && (
        <Card
          className="rounded-[22px] border-none bg-white"
          style={{ boxShadow: "0 14px 28px -10px rgba(255,90,95,0.16)" }}
        >
          <CardContent className="space-y-2">
            <p className="flex items-center gap-1.5 font-bold text-[#3A322B]">
              <CheckCircle2 className="size-4 text-primary" />
              Visite enregistrée — {result.balance} point{result.balance > 1 ? "s" : ""}
            </p>
            <Badge variant="secondary">Attribué à l&apos;employé connecté</Badge>
            <Button variant="outline" className="w-full rounded-full" onClick={reset}>
              <RotateCcw />
              Client suivant
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
