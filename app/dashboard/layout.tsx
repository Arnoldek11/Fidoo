import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { asEstablishmentUser } from "@/lib/db/scoped";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, QrCode, ScrollText, LogOut } from "lucide-react";
import { logout } from "./actions";

const NAV_LINKS = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/dashboard/customers", label: "Clients", icon: Users },
  { href: "/dashboard/scan", label: "Scanner", icon: QrCode },
  { href: "/dashboard/audit", label: "Journal d'accès", icon: ScrollText },
];

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

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <a href="/dashboard" className="flex items-center gap-2 font-semibold">
              <span className="flex size-7 items-center justify-center rounded-md bg-primary text-sm text-primary-foreground">
                F
              </span>
              {establishmentUser.establishment.name}
            </a>
            <nav className="hidden items-center gap-1 sm:flex">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "gap-1.5 text-muted-foreground"
                  )}
                >
                  <link.icon className="size-4" />
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
            >
              <LogOut className="size-4" />
              Se déconnecter
            </button>
          </form>
        </div>
        <nav className="flex items-center gap-1 overflow-x-auto border-t px-4 py-1.5 sm:hidden">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "shrink-0 gap-1.5 text-muted-foreground"
              )}
            >
              <link.icon className="size-4" />
              {link.label}
            </a>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">{children}</main>

      <footer className="mx-auto max-w-4xl px-4 pb-8 text-xs text-muted-foreground sm:px-6">
        <a href="/legal/privacy" className="hover:underline">
          Politique de confidentialité
        </a>{" "}
        ·{" "}
        <a href="/legal/terms" className="hover:underline">
          Conditions d&apos;utilisation
        </a>
      </footer>
    </div>
  );
}
