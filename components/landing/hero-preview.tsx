import { PhoneFrame } from "@/components/phone-frame";
import { WalletCard } from "@/components/wallet-card";
import { cn } from "@/lib/utils";

const NOTIFICATIONS = [
  { text: "+1 visite", className: "-top-3 -left-8", delay: "delay-150" },
  { text: "Récompense débloquée 🎉", className: "top-20 -right-14", delay: "delay-300" },
  { text: "Sophie est revenue", className: "bottom-10 -left-14", delay: "delay-500" },
];

export function HeroPreview() {
  return (
    <div className="relative mx-auto w-fit">
      <PhoneFrame>
        <WalletCard
          data={{
            name: "Maison Margo",
            logoDataUrl: null,
            cardColor: "#FF5A5F",
            textColor: "#FFFFFF",
            message: "Merci de votre fidélité !",
            rewardText: "10 visites = 1 café offert",
          }}
          variant="apple"
        />
      </PhoneFrame>
      {NOTIFICATIONS.map((n) => (
        <span
          key={n.text}
          className={cn(
            "absolute animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-md",
            n.className,
            n.delay
          )}
        >
          {n.text}
        </span>
      ))}
    </div>
  );
}
