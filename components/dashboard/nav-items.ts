import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  ScanLine,
  Award,
  Gift,
  Megaphone,
  Wallet,
  QrCode,
  TrendingUp,
  ScrollText,
  Settings,
  HelpCircle,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Pages not built yet in the current design pass — shown but not clickable. */
  soon?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/dashboard/customers", label: "Clients", icon: Users },
  { href: "/dashboard/scan", label: "Scanner", icon: ScanLine },
  { href: "/dashboard/loyalty", label: "Fidélité", icon: Award },
  { href: "/dashboard/rewards", label: "Récompenses", icon: Gift, soon: true },
  { href: "/dashboard/campaigns", label: "Campagnes", icon: Megaphone },
  { href: "/dashboard/wallet", label: "Cartes Wallet", icon: Wallet },
  { href: "/dashboard/qr-nfc", label: "QR & NFC", icon: QrCode },
  { href: "/dashboard/analytics", label: "Analytics", icon: TrendingUp, soon: true },
];

export const NAV_ITEMS_SECONDARY: NavItem[] = [
  { href: "/dashboard/audit", label: "Journal d'accès", icon: ScrollText },
  { href: "/dashboard/settings", label: "Paramètres", icon: Settings, soon: true },
  { href: "/dashboard/help", label: "Aide", icon: HelpCircle, soon: true },
];
