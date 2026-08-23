import { Coffee, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The dot/stamp card visual — shared by the real consumer-facing card
 * (app/card/[id]) and the owner-facing Fidélité page's preview, so both
 * ever only have one implementation of "what the stamp card looks like".
 */
export function StampProgress({
  balance,
  goal,
  rewardLabel = "récompense",
}: {
  balance: number;
  goal: number;
  rewardLabel?: string;
}) {
  const isComplete = balance >= goal;
  const stamps = Array.from({ length: goal }, (_, i) => i < balance);

  return (
    <div className="space-y-4 text-center">
      <div className="grid grid-cols-5 gap-3">
        {stamps.map((filled, i) => (
          <div
            key={i}
            className={cn(
              "flex aspect-square items-center justify-center rounded-full border-2",
              filled
                ? "border-primary bg-primary/10 text-primary"
                : "border-dashed border-muted-foreground/30 text-muted-foreground/30"
            )}
          >
            <Coffee className="size-4" />
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        {balance} / {goal}
      </p>

      <p
        className={cn(
          "flex items-center justify-center gap-1.5 text-sm font-medium",
          isComplete && "text-primary"
        )}
      >
        {isComplete ? (
          <>
            <Gift className="size-4" />
            {rewardLabel.charAt(0).toUpperCase() + rewardLabel.slice(1)} disponible !
          </>
        ) : (
          `Plus que ${goal - balance} avant votre ${rewardLabel}`
        )}
      </p>
    </div>
  );
}
