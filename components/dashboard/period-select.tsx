"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const OPTIONS = [
  { value: "7", label: "7 derniers jours" },
  { value: "30", label: "30 derniers jours" },
  { value: "90", label: "90 derniers jours" },
];

export function PeriodSelect({ period }: { period: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onValueChange(value: string | null) {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={String(period)} onValueChange={onValueChange}>
      <SelectTrigger className="h-9 rounded-full border-transparent bg-white text-sm font-semibold text-[#4A4038] shadow-[0_2px_10px_rgba(74,64,56,0.06)]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
