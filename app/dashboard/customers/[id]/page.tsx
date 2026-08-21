import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCustomerHistory } from "@/lib/loyalty/stats";
import { logAudit } from "@/lib/audit/log";
import { DeleteCustomerButton } from "./DeleteCustomerButton";

const EVENT_LABELS: Record<string, string> = {
  visit: "Visite",
  points_added: "Point ajouté",
  reward_redeemed: "Récompense échangée",
  campaign_sent: "Campagne envoyée",
  attributed_return: "Retour attribué à une campagne",
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const data = await getCustomerHistory(user.id, id);
  if (!data) notFound();

  await logAudit(user.id, "viewed_customer", "customer", id);

  const { customer, events } = data;

  return (
    <div className="min-h-screen bg-zinc-50 p-8 dark:bg-black">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            {customer.name ?? customer.phone}
          </h1>
          <a
            href="/dashboard/customers"
            className="text-sm text-zinc-500 hover:underline"
          >
            ← Clients
          </a>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {customer.phone} — client depuis le{" "}
            {customer.createdAt.toLocaleDateString("fr-BE")}
          </p>
          <DeleteCustomerButton customerId={customer.id} />
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-zinc-500">Historique</h2>
          <ol className="space-y-2">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex justify-between rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
              >
                <span>{EVENT_LABELS[event.type] ?? event.type}</span>
                <span className="text-zinc-500">
                  {event.createdAt.toLocaleString("fr-BE")}
                </span>
              </li>
            ))}
            {events.length === 0 && (
              <p className="text-sm text-zinc-500">Aucun événement.</p>
            )}
          </ol>
        </div>
      </div>
    </div>
  );
}
