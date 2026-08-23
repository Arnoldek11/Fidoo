import { cn } from "@/lib/utils";

export type WalletCardData = {
  name: string;
  logoDataUrl: string | null;
  cardColor: string;
  textColor: string;
  message: string;
  rewardText: string;
};

export function WalletCard({
  data,
  variant = "apple",
  className,
}: {
  data: WalletCardData;
  variant?: "apple" | "google";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden shadow-lg",
        variant === "apple" ? "rounded-2xl" : "rounded-xl",
        className
      )}
      style={{ backgroundColor: data.cardColor, color: data.textColor }}
    >
      <div className="flex items-center gap-2.5 p-4 pb-2">
        {data.logoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- user-provided data: URL, not a static/optimizable asset
          <img
            src={data.logoDataUrl}
            alt=""
            className="size-8 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
            style={{ backgroundColor: "color-mix(in oklch, currentColor, transparent 80%)" }}
          >
            {data.name.trim().charAt(0).toUpperCase() || "?"}
          </span>
        )}
        <span className="truncate text-sm font-medium opacity-90">
          {data.name || "Votre établissement"}
        </span>
      </div>

      <div className="space-y-1 px-4 pb-5">
        <p className="text-lg leading-snug font-semibold break-words">
          {data.rewardText || "10 points = 1 récompense"}
        </p>
        <p className="text-sm opacity-80 break-words">
          {data.message || "Merci de votre fidélité !"}
        </p>
      </div>

      <div className="flex items-center justify-center gap-0.5 bg-white py-3">
        {Array.from({ length: 28 }, (_, i) => (
          <span
            key={i}
            className={cn("w-0.5 bg-neutral-900", i % 3 === 0 ? "h-6" : "h-4")}
          />
        ))}
      </div>
    </div>
  );
}
