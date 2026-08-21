"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import {
  lookupCustomer,
  recordVisitForExistingCustomer,
  registerCustomerAndRecordVisit,
  type CustomerLookupResult,
  type RecordVisitResult,
} from "./actions";
import { CardQrCode } from "./CardQrCode";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, CheckCircle2, RotateCcw, Search, UserPlus } from "lucide-react";

const SCANNER_ELEMENT_ID = "qr-scanner";

type Html5QrcodeInstance = {
  start: (
    cameraConfig: { facingMode: string },
    scanConfig: { fps: number; qrbox: number },
    onSuccess: (decodedText: string) => void,
    onFailure: (error: string) => void
  ) => Promise<void>;
  stop: () => Promise<void>;
};

export default function ScanPage() {
  const [phone, setPhone] = useState("");
  const [lookup, setLookup] = useState<CustomerLookupResult | null>(null);
  const [result, setResult] = useState<RecordVisitResult | null>(null);
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
      const res = await lookupCustomer(value);
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
      const res = await recordVisitForExistingCustomer(customerId);
      setResult(res);
      setLookup(null);
    });
  }

  function handleRegister(e: FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await registerCustomerAndRecordVisit({
        phone,
        name: name || undefined,
        consent,
      });
      if ("status" in res) {
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
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-xl font-semibold">Scanner un client</h1>

      <Card className="overflow-hidden py-0">
        <div id={SCANNER_ELEMENT_ID} className="aspect-square w-full bg-muted" />
        {cameraStatus !== "ready" && (
          <CardContent className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
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
        <Button type="submit" disabled={isPending}>
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
        <Card>
          <CardContent className="space-y-3">
            <p>
              {lookup.name ?? "Client"} — {lookup.balance} point
              {lookup.balance > 1 ? "s" : ""}
            </p>
            <Button
              className="w-full"
              onClick={() => handleRecordVisit(lookup.customerId)}
              disabled={isPending}
            >
              Enregistrer la visite
            </Button>
          </CardContent>
        </Card>
      )}

      {lookup?.status === "not_found" && (
        <Card>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-3">
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
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
                  Le client accepte de recevoir des communications (SMS) de
                  cet établissement.
                </span>
              </Label>
              <Button type="submit" className="w-full" disabled={isPending}>
                Inscrire et enregistrer la visite
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="space-y-3">
            <p className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="size-4 text-primary" />
              Visite enregistrée — {result.balance} point
              {result.balance > 1 ? "s" : ""}
            </p>
            <CardQrCode customerId={result.customerId} />
            <Button variant="outline" className="w-full" onClick={reset}>
              <RotateCcw />
              Scanner un autre client
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
