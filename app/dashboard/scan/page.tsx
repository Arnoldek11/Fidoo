"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import {
  lookupCustomer,
  recordVisitForExistingCustomer,
  registerCustomerAndRecordVisit,
  type CustomerLookupResult,
} from "./actions";

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
  const [result, setResult] = useState<{ name: string | null; balance: number } | null>(null);
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
    <div className="min-h-screen bg-zinc-50 p-8 dark:bg-black">
      <div className="mx-auto max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Scanner un client</h1>
          <a href="/dashboard" className="text-sm text-zinc-500 hover:underline">
            ← Tableau de bord
          </a>
        </div>

        <div className="space-y-2">
          <div
            id={SCANNER_ELEMENT_ID}
            className="mx-auto w-full max-w-xs overflow-hidden rounded border border-zinc-300 dark:border-zinc-700"
          />
          {cameraStatus === "loading" && (
            <p className="text-center text-sm text-zinc-500">Activation de la caméra…</p>
          )}
          {cameraStatus === "unavailable" && (
            <p className="text-center text-sm text-zinc-500">
              Caméra indisponible — utilisez la saisie manuelle ci-dessous.
            </p>
          )}
        </div>

        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Numéro de téléphone"
            required
            className="flex-1 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            type="submit"
            disabled={isPending}
            className="rounded bg-black px-4 py-2 text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Rechercher
          </button>
        </form>

        {error && (
          <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        {lookup?.status === "found" && (
          <div className="space-y-3 rounded border border-zinc-300 p-4 dark:border-zinc-700">
            <p>
              {lookup.name ?? "Client"} — {lookup.balance} point{lookup.balance > 1 ? "s" : ""}
            </p>
            <button
              onClick={() => handleRecordVisit(lookup.customerId)}
              disabled={isPending}
              className="w-full rounded bg-black px-3 py-2 text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Enregistrer la visite
            </button>
          </div>
        )}

        {lookup?.status === "not_found" && (
          <form
            onSubmit={handleRegister}
            className="space-y-3 rounded border border-zinc-300 p-4 dark:border-zinc-700"
          >
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Nouveau client — {phone}
            </p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom (optionnel)"
              className="w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1"
              />
              <span>
                Le client accepte de recevoir des communications (SMS) de cet
                établissement.
              </span>
            </label>
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded bg-black px-3 py-2 text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Inscrire et enregistrer la visite
            </button>
          </form>
        )}

        {result && (
          <div className="space-y-3 rounded border border-green-300 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
            <p>
              Visite enregistrée — {result.balance} point
              {result.balance > 1 ? "s" : ""}
            </p>
            <button
              onClick={reset}
              className="w-full rounded border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Scanner un autre client
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
