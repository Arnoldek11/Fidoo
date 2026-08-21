import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCustomerCard } from "@/lib/loyalty/publicCard";

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

  const progress = Math.min(card.balance / card.goal, 1);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-6 dark:bg-black">
      <div className="w-full max-w-xs space-y-6 rounded-2xl border border-zinc-300 bg-white p-6 text-center shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <p className="text-sm text-zinc-500">{card.establishmentName}</p>

        {card.name && <p className="text-lg font-semibold">{card.name}</p>}

        <div className="space-y-2">
          <p className="text-4xl font-bold">
            {card.balance}
            <span className="text-lg font-normal text-zinc-500">
              /{card.goal}
            </span>
          </p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-black dark:bg-white"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <p className="text-sm text-zinc-500">
            {card.balance >= card.goal
              ? "Récompense disponible !"
              : `Plus que ${card.goal - card.balance} avant votre récompense`}
          </p>
        </div>
      </div>
    </div>
  );
}
