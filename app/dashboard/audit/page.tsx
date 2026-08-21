import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuditLog } from "@/lib/audit/log";

const ACTION_LABELS: Record<string, string> = {
  viewed_customer: "a consulté la fiche client",
  erased_customer: "a supprimé le client",
};

export default async function AuditLogPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const entries = await getAuditLog(user.id);

  return (
    <div className="min-h-screen bg-zinc-50 p-8 dark:bg-black">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Journal d&apos;accès</h1>
          <a href="/dashboard" className="text-sm text-zinc-500 hover:underline">
            ← Tableau de bord
          </a>
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Qui a consulté ou supprimé des données client, et quand.
        </p>

        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
            >
              {entry.createdAt.toLocaleString("fr-BE")} —{" "}
              {ACTION_LABELS[entry.action] ?? entry.action} ({entry.targetId})
            </div>
          ))}
          {entries.length === 0 && (
            <p className="text-sm text-zinc-500">Aucune entrée pour le moment.</p>
          )}
        </div>
      </div>
    </div>
  );
}
