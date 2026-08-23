"use client";

import { useId } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function ColorField({
  label,
  value,
  presets,
  onChange,
}: {
  label: string;
  value: string;
  presets: string[];
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="size-8 shrink-0 cursor-pointer rounded-[8px] border border-input bg-transparent p-0.5"
        />
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            aria-label={preset}
            onClick={() => onChange(preset)}
            className={cn(
              "size-6 rounded-full border border-border transition-transform hover:scale-110",
              value.toLowerCase() === preset.toLowerCase() &&
                "ring-2 ring-ring ring-offset-2 ring-offset-background"
            )}
            style={{ backgroundColor: preset }}
          />
        ))}
      </div>
    </div>
  );
}

export const CARD_COLOR_PRESETS = ["#FF5A5F", "#171717", "#22A06B", "#2563EB"];
export const TEXT_COLOR_PRESETS = ["#FFFFFF", "#171717"];
