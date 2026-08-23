import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { asEstablishmentUser } from "@/lib/db/scoped";
import { Logo } from "@/components/logo";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { EstablishmentSwitcher } from "@/components/dashboard/establishment-switcher";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { LogOut } from "lucide-react";
import { logout } from "./actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const establishmentUser = await asEstablishmentUser(user.id, (tx) =>
    tx.establishmentUser.findUnique({
      where: { id: user.id },
      include: { establishment: true },
    })
  );
  if (!establishmentUser) redirect("/login?error=no-establishment");

  const { establishment } = establishmentUser;

  return (
    <div className="min-h-screen bg-background md:flex">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="flex flex-col gap-4 px-4 pt-5 pb-3">
          <a href="/dashboard" className="px-1">
            <Logo className="h-4 w-auto" />
          </a>
          <EstablishmentSwitcher name={establishment.name} city={establishment.city} />
        </div>
        <SidebarNav />
        <div className="border-t border-border p-3">
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogOut className="size-[18px]" strokeWidth={1.75} />
              Se déconnecter
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
          <a href="/dashboard">
            <Logo className="h-4 w-auto" />
          </a>
          <MobileNav establishmentName={establishment.name} establishmentCity={establishment.city} />
        </header>

        <main className="flex-1">
          <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 md:px-8 md:py-10 lg:px-10">
            {children}
          </div>
        </main>

        <footer className="mx-auto w-full max-w-[1400px] px-4 pb-8 text-xs text-muted-foreground sm:px-6 md:px-8 lg:px-10">
          <a href="/legal/privacy" className="hover:underline">
            Politique de confidentialité
          </a>{" "}
          ·{" "}
          <a href="/legal/terms" className="hover:underline">
            Conditions d&apos;utilisation
          </a>
        </footer>
      </div>
    </div>
  );
}
