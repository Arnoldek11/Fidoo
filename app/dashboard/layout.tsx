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
    <div className="min-h-screen md:flex" style={{ background: "#FBF6EF" }}>
      <aside className="hidden w-64 shrink-0 flex-col md:flex">
        <div className="flex flex-col gap-4 px-4 pt-6 pb-3">
          <a href="/dashboard" className="px-2">
            <Logo className="h-4 w-auto" />
          </a>
          <EstablishmentSwitcher name={establishment.name} city={establishment.city} />
        </div>
        <SidebarNav />
        <div className="p-3">
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-[#8A7D6C] hover:bg-white hover:text-[#3A322B]"
            >
              <LogOut className="size-[18px]" strokeWidth={2} />
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
