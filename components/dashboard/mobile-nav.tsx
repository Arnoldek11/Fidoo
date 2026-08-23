"use client";

import { useState } from "react";
import { Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/logo";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { EstablishmentSwitcher } from "@/components/dashboard/establishment-switcher";
import { logout } from "@/app/dashboard/actions";

export function MobileNav({
  establishmentName,
  establishmentCity,
}: {
  establishmentName: string;
  establishmentCity: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Menu" />}>
        <Menu className="size-5" strokeWidth={1.75} />
      </SheetTrigger>
      <SheetContent side="left" className="flex w-72 flex-col gap-0 p-0">
        <SheetHeader className="px-4 pt-5 pb-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <Logo className="h-4 w-auto" />
        </SheetHeader>
        <div className="px-4 pt-4">
          <EstablishmentSwitcher name={establishmentName} city={establishmentCity} />
        </div>
        <SidebarNav onNavigate={() => setOpen(false)} />
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
      </SheetContent>
    </Sheet>
  );
}
