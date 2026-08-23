"use client";

import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, NAV_ITEMS_SECONDARY, type NavItem } from "./nav-items";

function SidebarLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);

  if (item.soon) {
    return (
      <div className="flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-sm text-muted-foreground/60">
        <item.icon className="size-[18px] shrink-0" strokeWidth={1.75} />
        <span className="flex-1">{item.label}</span>
        <Badge variant="outline" className="border-border/70 text-[10px] text-muted-foreground/70">
          Bientôt
        </Badge>
      </div>
    );
  }

  return (
    <a
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-accent text-accent-foreground"
          : "text-foreground/80 hover:bg-muted hover:text-foreground"
      )}
    >
      <item.icon className="size-[18px] shrink-0" strokeWidth={1.75} />
      {item.label}
    </a>
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-2">
      <div className="space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <SidebarLink key={item.href} item={item} onNavigate={onNavigate} />
        ))}
      </div>
      <div className="space-y-0.5 border-t border-border pt-3">
        {NAV_ITEMS_SECONDARY.map((item) => (
          <SidebarLink key={item.href} item={item} onNavigate={onNavigate} />
        ))}
      </div>
    </nav>
  );
}
