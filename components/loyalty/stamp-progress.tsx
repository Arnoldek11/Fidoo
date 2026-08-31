import { Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStampIcon } from "@/components/loyalty/stamp-icons";

// Static class names only — Tailwind can't see dynamically built ones.
function gridColsFor(goal: number): string {
  if (goal % 5 === 0) return "grid-cols-5";
  if (goal % 4 === 0) return "grid-cols-4";
  if (goal % 3 === 0) return "grid-cols-3";
  return "grid-cols-5";
}

/**
 * The dot/stamp card visual — shared by the real consumer-facing card
 * (app/card/[id]), the tap flow, and the owner-facing Fidélité editor's
 * preview, so all of them only ever have one implementation of "what the
 * stamp card looks like". Colors/icon come from the establishment's
 * loyalty program; without them it renders the historical coral/coffee
 * defaults.
 */
export function StampProgress({
  balance,
  goal,
  rewardLabel = "récompense",
  icon,
  accentColor,
  popIndex,
}: {
  balance: number;
  goal: number;
  rewardLabel?: string;
  /** Stamp icon name from components/loyalty/stamp-icons (default: coffee). */
  icon?: string;
  /** Hex accent for filled stamps + reward text (default: theme coral). */
  accentColor?: string;
  /** Index of a just-earned stamp to animate in (tap flow); others render statically. */
  popIndex?: number;
}) {
  const isComplete = balance >= goal;
  const stamps = Array.from({ length: goal }, (_, i) => i < balance);
  // "votre récompense" but "un café offert" — don't stack "votre" onto a
  // label that already starts with its own article/determiner.
  const hasArticle = /^(un|une|le|la|les|l['’]|des|du|votre|vos|mon|ma)\s?/i.test(rewardLabel);
  const rewardPhrase = hasArticle ? rewardLabel : `votre ${rewardLabel}`;
  const StampIcon = getStampIcon(icon);
  const filledStyle = accentColor
    ? { borderColor: accentColor, color: accentColor, backgroundColor: `${accentColor}1A` }
    : undefined;

  return (
    <div className="space-y-4 text-center">
      <div className={cn("grid gap-3", gridColsFor(goal))}>
        {stamps.map((filled, i) => (
          <div
            key={i}
            className={cn(
              "flex aspect-square items-center justify-center rounded-full border-2",
              filled
                ? "border-primary bg-primary/10 text-primary"
                : "border-dashed border-muted-foreground/30 text-muted-foreground/30",
              filled && i === popIndex && "animate-in zoom-in-50 duration-500"
            )}
            style={filled ? filledStyle : undefined}
          >
            <StampIcon className="size-4" />
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        {balance} / {goal}
      </p>

      <p
        className={cn(
          "flex items-center justify-center gap-1.5 text-sm font-medium",
          isComplete && !accentColor && "text-primary"
        )}
        style={isComplete && accentColor ? { color: accentColor } : undefined}
      >
        {isComplete ? (
          <>
            <Gift className="size-4" />
            {rewardLabel.charAt(0).toUpperCase() + rewardLabel.slice(1)} disponible !
          </>
        ) : (
          `Plus que ${goal - balance} avant ${rewardPhrase}`
        )}
      </p>
    </div>
  );
}
