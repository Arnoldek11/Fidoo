import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SuggestionCard({
  icon: Icon,
  title,
  description,
  ctaLabel,
  ctaTitle,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel: string;
  ctaTitle?: string;
}) {
  return (
    <Card className="border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] [--card-spacing:--spacing(6)]">
      <CardContent className="flex h-full flex-col gap-4">
        <span className="flex size-10 items-center justify-center rounded-full bg-primary-tint text-primary">
          <Icon className="size-5" strokeWidth={1.75} />
        </span>
        <div className="flex-1 space-y-1">
          <p className="font-medium text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button disabled title={ctaTitle ?? "Bientôt disponible"} className="w-full">
          {ctaLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
