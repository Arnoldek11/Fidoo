# Onboarding a Real Pilot Establishment

> **Why this exists:** `prisma/seed.ts` creates test accounts with hardcoded Supabase Auth user ids — it's not usable for a real café. Until Phase 6 (Stripe) adds a self-serve signup flow, real pilots are onboarded manually via `scripts/onboard-pilot.ts`. This is the checklist for that.

---

## One-time prerequisites (only needed the first time)

1. **Service role key.** Supabase dashboard → your Fidoo project → **Settings → API → service_role key**. Add it to `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
   Never commit this — it bypasses RLS entirely (same caveat as the `postgres` role in `lib/db/scoped.ts`). `.env.local` is already gitignored.

2. **Auth email delivery.** The script invites the owner via Supabase's built-in `inviteUserByEmail`, which sends a real email through Supabase Auth. Before the first real pilot, confirm in Supabase dashboard → **Authentication → Email Templates / SMTP settings** that:
   - The "Invite user" template is enabled and reads reasonably (default Supabase copy is generic — consider customizing it to mention Fidoo by name).
   - If you've set custom SMTP (recommended before real customers depend on this — Supabase's default email sender has low rate limits and can land in spam), it's configured and tested.

## Onboarding one establishment

1. Run:
   ```bash
   npx tsx scripts/onboard-pilot.ts "Café Central" Bruxelles owner@example.com
   ```
   This creates the Supabase Auth invite, the `Establishment` row, and the `EstablishmentUser` row (`role: "owner"`) in one go.

2. The script prints:
   - Confirmation the invite email was sent.
   - The establishment id.
   - The `/join/[establishmentId]` link for their QR poster.

3. **Tell the owner to check their email** (including spam) for the Supabase invite, click through, and set their password.

4. Once they log in for the first time, they land on `/onboarding` — the guided wizard to set their card branding.

5. **Before they use the counter**, someone (owner or you) needs to add at least one staff member at `/dashboard/staff` — the Staff PWA at `/staff/[establishmentId]` has nothing to select otherwise.

6. Hand them the `/join/[establishmentId]` QR code (print via `/dashboard/qr-nfc` once that page's "Télécharger"/"Imprimer" buttons are wired — for now, screenshot the QR shown there) so customers can self-join.

## If something goes wrong

- **"user already registered"**: that email already has a Supabase Auth account. Check `establishment_users` for an existing row before assuming it's a duplicate signup — the script won't create a second establishment for the same owner id.
- **Invite email never arrives**: check Supabase dashboard → Authentication → Logs for the invite attempt; likely a spam-filtering or SMTP config issue, not a script bug (see prerequisite #2 above).
- **Wrong establishment name/city entered**: fix directly in the `establishments` table (`UPDATE establishments SET name = ..., city = ... WHERE id = '...'`) — there's no dashboard edit UI for this yet.

## After onboarding: track it

This is a business milestone, not just a technical one — update `PROGRESS.md`'s "Fidoo-Specific Open Items" section (pilot count) and the field-validation funnel referenced in `resume-projet-loyalty-horeca.md` (30 interviews → 10 interested → 5 pilots → 3+ paying).
