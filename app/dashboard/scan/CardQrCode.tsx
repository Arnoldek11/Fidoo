"use client";

import { useEffect, useState } from "react";

export function CardQrCode({ customerId }: { customerId: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const cardUrl = `${window.location.origin}/card/${customerId}`;

    import("qrcode").then((QRCode) => {
      QRCode.toDataURL(cardUrl, { width: 200, margin: 1 }).then((url) => {
        if (!cancelled) setDataUrl(url);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [customerId]);

  if (!dataUrl) return null;

  return (
    <div className="space-y-1 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dataUrl}
        alt="QR code de la carte de fidélité du client"
        className="mx-auto"
        width={160}
        height={160}
      />
      <p className="text-xs text-zinc-500">
        Le client scanne ce code avec son téléphone pour ouvrir sa carte
      </p>
    </div>
  );
}
