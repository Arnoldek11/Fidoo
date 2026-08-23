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
      <div className="flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-[#B0A290]">
        <item.icon className="size-[18px] shrink-0" strokeWidth={2} />
        <span className="flex-1">{item.label}</span>
        <Badge variant="outline" className="border-[#F0E4D3] text-[10px] text-[#B0A290]">
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
        "flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-all",
        active
          ? "bg-primary text-white shadow-[0_6px_16px_rgba(255,90,95,0.3)]"
          : "text-[#6B5F52] hover:bg-white"
      )}
    >
      <item.icon className="size-[18px] shrink-0" strokeWidth={2} />
      {item.label}
    </a>
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-2">
      <div className="space-y-1">
        {NAV_ITEMS.map((item) => (
          <SidebarLink key={item.href} item={item} onNavigate={onNavigate} />
        ))}
      </div>
      <div className="space-y-1 border-t border-[#F0E4D3] pt-3">
        {NAV_ITEMS_SECONDARY.map((item) => (
          <SidebarLink key={item.href} item={item} onNavigate={onNavigate} />
        ))}
      </div>
    </nav>
  );
}
