"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Nfc } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * The establishment's tap link — the one URL to write on an NFC tag (or
 * print as a QR) at the till. Same generation pattern as JoinQrCode.
 */
export function TapNfcCard({ establishmentId }: { establishmentId: string }) {
  const [tapUrl, setTapUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const url = `${window.location.origin}/tap/${establishmentId}`;
    setTapUrl(url);

    import("qrcode").then((QRCode) => {
      QRCode.toDataURL(url, { width: 240, margin: 1 }).then((result) => {
        if (!cancelled) setQrDataUrl(result);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [establishmentId]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(tapUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (http, old browser) — the URL stays visible to select by hand.
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-2xl bg-[#F6ECDD] p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary">
          <Nfc className="size-5" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#3A322B]">Votre lien de tampon</p>
          <p className="truncate text-xs font-medium text-[#8A7D6C]">{tapUrl || "…"}</p>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <div className="flex size-24 shrink-0 items-center justify-center rounded-2xl bg-[#F6ECDD]">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- generated data: URL, not a static asset
            <img src={qrDataUrl} alt="Code QR du lien de tampon" width={88} height={88} />
          ) : (
            <span className="text-xs font-medium text-[#8A7D6C]">…</span>
          )}
        </div>
        <ol className="list-inside list-decimal space-y-1.5 text-sm font-medium text-[#5B4F44]">
          <li>Copiez le lien ci-dessous.</li>
          <li>
            Écrivez-le sur un tag NFC (NTAG213 ou plus) avec une app gratuite comme «&nbsp;NFC
            Tools&nbsp;».
          </li>
          <li>Collez le tag près de la caisse — un tap, un tampon.</li>
        </ol>
      </div>

      <Button className="w-full rounded-full" onClick={handleCopy} disabled={!tapUrl}>
        {copied ? <Check /> : <Copy />}
        {copied ? "Lien copié !" : "Copier le lien"}
      </Button>
    </div>
  );
}
