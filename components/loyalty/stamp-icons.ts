import {
  Beer,
  CakeSlice,
  Coffee,
  Croissant,
  Heart,
  IceCreamCone,
  Martini,
  Pizza,
  Sandwich,
  Scissors,
  type LucideIcon,
} from "lucide-react";

/**
 * Curated stamp icons an establishment can pick for its card — stored by
 * name in loyalty_programs.stamp_icon. Names are the stable contract;
 * unknown/legacy names fall back to the coffee cup rather than crashing a
 * customer's card.
 */
export const STAMP_ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  coffee: { icon: Coffee, label: "Café" },
  croissant: { icon: Croissant, label: "Croissant" },
  pizza: { icon: Pizza, label: "Pizza" },
  burger: { icon: Sandwich, label: "Snack" },
  beer: { icon: Beer, label: "Bière" },
  cocktail: { icon: Martini, label: "Cocktail" },
  glace: { icon: IceCreamCone, label: "Glace" },
  dessert: { icon: CakeSlice, label: "Dessert" },
  coeur: { icon: Heart, label: "Cœur" },
  ciseaux: { icon: Scissors, label: "Ciseaux" },
};

export const STAMP_ICON_NAMES = Object.keys(STAMP_ICONS);

export function getStampIcon(name: string | undefined): LucideIcon {
  return (name && STAMP_ICONS[name]?.icon) || Coffee;
}
