"use client";

import { useEffect, useState } from "react";

export function JoinQrCode({ establishmentId }: { establishmentId: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [joinUrl, setJoinUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    const url = `${window.location.origin}/join/${establishmentId}`;

    import("qrcode").then((QRCode) => {
      QRCode.toDataURL(url, { width: 240, margin: 1 }).then((result) => {
        if (!cancelled) {
          setDataUrl(result);
          setJoinUrl(url);
        }
      });
    });

    return () => {
      cancelled = true;
    };
  }, [establishmentId]);

  return (
    <div className="space-y-3 text-center">
      <div className="mx-auto flex size-48 items-center justify-center rounded-2xl bg-[#F6ECDD]">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- generated data: URL, not a static asset
          <img src={dataUrl} alt="Code QR pour rejoindre le programme" width={192} height={192} />
        ) : (
          <span className="text-xs font-medium text-[#8A7D6C]">Génération…</span>
        )}
      </div>
      <p className="truncate text-xs font-medium text-[#B0A290]">{joinUrl}</p>
    </div>
  );
}
