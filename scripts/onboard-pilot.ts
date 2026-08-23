import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

/**
 * One-time setup for a real pilot establishment: creates their Supabase Auth
 * user (via an official invite email — no homemade auth, no throwaway
 * password), then the Establishment + EstablishmentUser rows.
 *
 * Usage: npx tsx scripts/onboard-pilot.ts "Café Central" Bruxelles owner@example.com
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (Supabase dashboard →
 * Project Settings → API → service_role key). Never commit this key — it
 * bypasses RLS entirely, same caveat as the `postgres` role documented in
 * lib/db/scoped.ts.
 */
async function main() {
  const [name, city, ownerEmail] = process.argv.slice(2);

  if (!name || !city || !ownerEmail) {
    console.error(
      'Usage: npx tsx scripts/onboard-pilot.ts "<Establishment Name>" <City> <owner@email.com>'
    );
    process.exitCode = 1;
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
    console.error(`"${ownerEmail}" doesn't look like a valid email address.`);
    process.exitCode = 1;
    return;
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRoleKey || !supabaseUrl) {
    console.error(
      "Missing SUPABASE_SERVICE_ROLE_KEY (and/or NEXT_PUBLIC_SUPABASE_URL) in .env.local.\n" +
        "Get the service_role key from the Supabase dashboard → Project Settings → API,\n" +
        "add it to .env.local as SUPABASE_SERVICE_ROLE_KEY, and never commit it."
    );
    process.exitCode = 1;
    return;
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`Inviting ${ownerEmail}…`);
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(ownerEmail);
  if (error || !data.user) {
    console.error(`Failed to invite ${ownerEmail}: ${error?.message ?? "unknown error"}`);
    console.error(
      "If this is 'user already registered', that owner already has an account — " +
        "check the establishment_users table instead of re-running this script."
    );
    process.exitCode = 1;
    return;
  }

  const establishment = await prisma.establishment.create({
    data: { name, city },
  });

  await prisma.establishmentUser.create({
    data: {
      id: data.user.id,
      establishmentId: establishment.id,
      email: ownerEmail,
      role: "owner",
    },
  });

  console.log(`\nDone. ${name} (${establishment.id}) is set up.`);
  console.log(`- Invite email sent to ${ownerEmail} — they set their password via that link.`);
  console.log(`- Once logged in, they land on /onboarding to customize their card.`);
  console.log(`- Add counter staff at /dashboard/staff before using /staff/${establishment.id}.`);
  console.log(`- Self-join link for their QR poster: /join/${establishment.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
