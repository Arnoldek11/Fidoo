import { createClient } from "@/lib/supabase/server";

// One-off manual validation route for the Phase 8 checklist ("a deliberately
// triggered error shows up in Sentry within minutes") — gated behind auth
// so it can't be used to spam Sentry from the public internet.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Not authenticated", { status: 401 });
  }

  throw new Error("Fidoo Sentry test error — safe to ignore");
}
