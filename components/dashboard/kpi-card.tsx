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
    <Card className="border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] [--card-spacing:--spacing(6)]">
      <CardContent>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          {formatValue(value, percent)}
        </p>
        {deltaPct === null ? (
          <p className="mt-1.5 text-sm text-muted-foreground/60">Pas de comparaison</p>
        ) : (
          <p
            className={cn(
              "mt-1.5 flex items-center gap-1 text-sm font-medium",
              positive && "text-success",
              negative && "text-error",
              !positive && !negative && "text-muted-foreground"
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
