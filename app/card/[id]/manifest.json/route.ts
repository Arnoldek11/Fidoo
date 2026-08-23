import { NextResponse } from "next/server";
import { getCustomerCard } from "@/lib/loyalty/publicCard";

// A per-customer manifest, not the shared /manifest.json — its start_url
// points at this specific customer's card so "Add to Home Screen" reopens
// their card directly instead of the marketing landing page. This is the
// wallet-lite pass: no real Apple/Google Wallet issuance, just a homescreen
// shortcut to a page that always shows the live balance (Phase 4, revised).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const card = await getCustomerCard(id);
  if (!card) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const manifest = {
    name: `${card.establishmentName} — Carte de fidélité`,
    short_name: card.establishmentName,
    start_url: `/card/${id}`,
    display: "standalone",
    background_color: "#FAFAF8",
    theme_color: "#FF5A5F",
    icons: [{ src: "/icon-mark.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };

  return NextResponse.json(manifest, {
    headers: { "Content-Type": "application/manifest+json" },
  });
}
