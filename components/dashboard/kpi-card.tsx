import { ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function formatValue(value: number, percent?: boolean) {
  if (percent) {
    return `${value.toLocaleString("fr-BE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
  }
  return value.toLocaleString("fr-BE");
}

export function KpiCard({
  label,
  value,
  deltaPct,
  percent,
}: {
  label: string;
  value: number;
  deltaPct: number | null;
  percent?: boolean;
}) {
  const positive = deltaPct !== null && deltaPct > 0;
  const negative = deltaPct !== null && deltaPct < 0;

  return (
    <Card
      className="rounded-[22px] border-none bg-white [--card-spacing:--spacing(5)]"
      style={{ boxShadow: "0 14px 28px -10px rgba(74,64,56,0.1)" }}
    >
      <CardContent>
        <p className="text-[13px] font-semibold text-[#8A7D6C]">{label}</p>
        <p className="font-heading mt-2 text-3xl font-bold tracking-tight text-[#3A322B]">
          {formatValue(value, percent)}
        </p>
        {deltaPct === null ? (
          <p className="mt-1.5 text-sm font-medium text-[#B0A290]">Pas de comparaison</p>
        ) : (
          <p
            className={cn(
              "mt-1.5 flex items-center gap-1 text-sm font-bold",
              positive && "text-success",
              negative && "text-error",
              !positive && !negative && "text-[#8A7D6C]"
            )}
          >
            {positive && <ArrowUp className="size-3.5" strokeWidth={2.5} />}
            {negative && <ArrowDown className="size-3.5" strokeWidth={2.5} />}
            {Math.abs(deltaPct).toLocaleString("fr-BE", { maximumFractionDigits: 1 })} %
          </p>
        )}
      </CardContent>
    </Card>
  );
}
