import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { asEstablishmentUser } from "@/lib/db/scoped";
import { logout } from "./actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const establishmentUser = await asEstablishmentUser(user.id, (tx) =>
    tx.establishmentUser.findUnique({
      where: { id: user.id },
      include: { establishment: true },
    })
  );

  if (!establishmentUser) {
    redirect("/login?error=no-establishment");
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-8 dark:bg-black">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">
            Bienvenue {establishmentUser.establishment.name}
          </h1>
          <form action={logout}>
            <button
              type="submit"
              className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Se déconnecter
            </button>
          </form>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400">
          {establishmentUser.establishment.city} —{" "}
          {establishmentUser.establishment.plan}
        </p>
        <a
          href="/dashboard/scan"
          className="inline-block rounded bg-black px-4 py-2 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          Scanner un client
        </a>
      </div>
    </div>
  );
}
