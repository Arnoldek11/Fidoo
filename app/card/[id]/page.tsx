import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCustomerCard } from "@/lib/loyalty/publicCard";
import { Coffee, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function CustomerCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const card = await getCustomerCard(id);
  if (!card) notFound();

  const isComplete = card.balance >= card.goal;
  const stamps = Array.from({ length: card.goal }, (_, i) => i < card.balance);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-xs overflow-hidden rounded-2xl border bg-card shadow-lg">
        <div className="bg-primary px-6 py-5 text-center text-primary-foreground">
          <p className="text-xs font-medium uppercase tracking-wide opacity-80">
            {card.establishmentName}
          </p>
          {card.name && <p className="mt-1 text-lg font-semibold">{card.name}</p>}
        </div>

        <div className="space-y-4 p-6 text-center">
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
            {card.balance} / {card.goal}
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
                Récompense disponible !
              </>
            ) : (
              `Plus que ${card.goal - card.balance} avant votre récompense`
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
