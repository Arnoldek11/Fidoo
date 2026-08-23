import { ChevronDown } from "lucide-react";

/**
 * The data model is single-establishment-per-user for now (see
 * EstablishmentUser in schema.prisma), so this isn't wired to a real
 * switcher — it's the brief's visual affordance, ready for when
 * multi-location accounts exist.
 */
export function EstablishmentSwitcher({ name, city }: { name: string; city: string }) {
  return (
    <div
      className="flex items-center justify-between gap-2 rounded-2xl bg-white px-3.5 py-3 text-sm"
      style={{ boxShadow: "0 2px 10px rgba(74,64,56,0.05)" }}
    >
      <span className="truncate font-semibold text-[#3A322B]">
        {name} <span className="font-medium text-[#8A7D6C]">— {city}</span>
      </span>
      <ChevronDown className="size-4 shrink-0 text-[#8A7D6C]" strokeWidth={2} />
    </div>
  );
}
