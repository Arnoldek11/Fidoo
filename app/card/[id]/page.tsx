import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCustomerCard } from "@/lib/loyalty/publicCard";
import { StampProgress } from "@/components/loyalty/stamp-progress";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    robots: { index: false, follow: false },
    // Per-customer manifest (not the shared /manifest.json) so "Add to Home
    // Screen" reopens this exact card — see manifest.json/route.ts.
    manifest: `/card/${id}/manifest.json`,
  };
}

export default async function CustomerCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const card = await getCustomerCard(id);
  if (!card) notFound();

  return (
    <div className="flex min-h-screen items-center justify-center p-6" style={{ background: "#FBF6EF" }}>
      <div
        className="w-full max-w-xs overflow-hidden rounded-[24px] bg-white"
        style={{ boxShadow: "0 14px 28px -10px rgba(74,64,56,0.14)" }}
      >
        <div className="bg-primary px-6 py-5 text-center text-primary-foreground">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
            {card.establishmentName}
          </p>
          {card.name && <p className="font-heading mt-1 text-lg font-bold">{card.name}</p>}
        </div>

        <div className="p-6">
          <StampProgress balance={card.balance} goal={card.goal} />
        </div>
      </div>
    </div>
  );
}
