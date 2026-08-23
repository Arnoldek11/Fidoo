"use client";

import { useId, type ChangeEvent } from "react";
import { Upload } from "lucide-react";
import { Label } from "@/components/ui/label";

export function LogoUploadField({
  logoDataUrl,
  onChange,
  label = "Logo",
}: {
  logoDataUrl: string | null;
  onChange: (dataUrl: string) => void;
  label?: string;
}) {
  const id = useId();

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
          {logoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- local file preview, not a static asset
            <img src={logoDataUrl} alt="" className="size-full object-cover" />
          ) : (
            <Upload className="size-4 text-muted-foreground" strokeWidth={1.75} />
          )}
        </span>
        <label
          htmlFor={id}
          className="cursor-pointer rounded-[10px] border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          Choisir un fichier
        </label>
        <input id={id} type="file" accept="image/*" onChange={handleChange} className="sr-only" />
      </div>
    </div>
  );
}
