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
    <Card
      className="rounded-[22px] border-none bg-white [--card-spacing:--spacing(6)]"
      style={{ boxShadow: "0 14px 28px -10px rgba(74,64,56,0.1)" }}
    >
      <CardContent className="flex h-full flex-col gap-4">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-tint text-primary">
          <Icon className="size-5" strokeWidth={2} />
        </span>
        <div className="flex-1 space-y-1">
          <p className="font-heading font-bold text-[#3A322B]">{title}</p>
          <p className="text-sm font-medium text-[#8A7D6C]">{description}</p>
        </div>
        <Button disabled title={ctaTitle ?? "Bientôt disponible"} className="w-full rounded-full">
          {ctaLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
