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
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <div className="w-full max-w-xs overflow-hidden rounded-2xl border bg-card shadow-lg">
        <div className="bg-primary px-6 py-5 text-center text-primary-foreground">
          <p className="text-xs font-medium uppercase tracking-wide opacity-80">
            {card.establishmentName}
          </p>
          {card.name && <p className="mt-1 text-lg font-semibold">{card.name}</p>}
        </div>

        <div className="p-6">
          <StampProgress balance={card.balance} goal={card.goal} />
        </div>
      </div>
    </div>
  );
}
