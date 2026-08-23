import { PhoneFrame } from "@/components/phone-frame";
import { WalletCard } from "@/components/wallet-card";

export function HeroPreview() {
  return (
    <div className="relative mx-auto flex w-fit items-center justify-center py-6">
      <div
        className="absolute h-56 w-72 rounded-[28px] bg-[#FFE4C4] shadow-[0_20px_40px_-10px_rgba(74,64,56,0.15)]"
        style={{ transform: "rotate(-8deg) translate(18px, -30px)" }}
      />
      <div
        className="absolute h-56 w-72 rounded-[28px] border-2 border-[#F0E4D3] bg-white shadow-[0_20px_40px_-10px_rgba(74,64,56,0.12)]"
        style={{ transform: "rotate(5deg) translate(-14px, 24px)" }}
      />
      <div className="relative">
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
      </div>
    </div>
  );
}
