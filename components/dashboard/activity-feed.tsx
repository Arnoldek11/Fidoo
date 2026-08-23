import { CheckCircle2, Gift, UserPlus, Sparkles, type LucideIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { ActivityFeedItem } from "@/lib/loyalty/stats";

const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });

function relativeTime(date: Date) {
  const diffMin = Math.round((date.getTime() - Date.now()) / 60_000);
  if (Math.abs(diffMin) < 1) return "à l'instant";
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 24) return rtf.format(diffHour, "hour");
  return rtf.format(Math.round(diffHour / 24), "day");
}

function describe(item: ActivityFeedItem): { icon: LucideIcon; text: string } {
  switch (item.kind) {
    case "visit":
      return { icon: CheckCircle2, text: `${item.customerLabel} est passé·e en caisse` };
    case "points_added":
      return {
        icon: Sparkles,
        text: `${item.customerLabel} a gagné ${item.points ?? ""} point${(item.points ?? 0) > 1 ? "s" : ""}`.trim(),
      };
    case "reward_redeemed":
      return { icon: Gift, text: `${item.customerLabel} a utilisé une récompense` };
    case "new_customer":
      return { icon: UserPlus, text: `${item.customerLabel} a rejoint le programme` };
  }
}

export function ActivityFeed({ items }: { items: ActivityFeedItem[] }) {
  return (
    <Card
      className="rounded-[24px] border-none bg-white [--card-spacing:--spacing(5.5)]"
      style={{ boxShadow: "0 14px 28px -10px rgba(74,64,56,0.1)" }}
    >
      <CardHeader>
        <CardTitle className="font-heading text-base font-bold text-[#3A322B]">
          Activité en direct
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm font-medium text-[#8A7D6C]">
            Pas encore d&apos;activité à afficher.
          </p>
        ) : (
          <ul className="divide-y divide-[#F6ECDD]">
            {items.map((item) => {
              const { icon: Icon, text } = describe(item);
              return (
                <li key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary-tint text-primary">
                    <Icon className="size-4" strokeWidth={2} />
                  </span>
                  <span className="flex-1 text-sm font-semibold text-[#3A322B]">{text}</span>
                  <span className="shrink-0 text-xs font-medium text-[#B0A290]">
                    {relativeTime(item.createdAt)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
