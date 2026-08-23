import { ChevronDown } from "lucide-react";

/**
 * The data model is single-establishment-per-user for now (see
 * EstablishmentUser in schema.prisma), so this isn't wired to a real
 * switcher — it's the brief's visual affordance, ready for when
 * multi-location accounts exist.
 */
export function EstablishmentSwitcher({ name, city }: { name: string; city: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-[10px] px-3 py-2 text-sm">
      <span className="truncate font-medium text-foreground">
        {name} <span className="font-normal text-muted-foreground">— {city}</span>
      </span>
      <ChevronDown className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
    </div>
  );
}
