# Fidoo — Progress Log

> **Purpose:** This file is the single source of truth for project status. Claude Code updates it after every phase gate passes. Arnold pastes its contents into claude.ai (chat with strategic Claude) whenever he needs a status-informed conversation, review, or planning session.
>
> **Rule for Claude Code:** Update this file automatically right after a phase's validation gate passes — don't wait to be asked. Keep entries factual and concise. Never delete history; append.

---

## Snapshot (update this block every time)

- **Last updated:** 2026-08-31 (self-tap flow + card customization + redemption built; `loyalty_programs` migration applied with Arnold's explicit approval, 97/97 tests pass, customer-facing flow e2e-verified in a real browser — see changelog)
- **Current phase:** The **visual redesign pass** is complete — see "Frontend / Design Status" below. **Phase 6 (Stripe billing) gate passed**: Arnold ran a real end-to-end test-mode Checkout on `localhost:3100` (test card `4242...`), the webhook (`checkout.session.completed`) was received and processed (`200`, confirmed in the `stripe listen` log), and the establishment's plan/billing status updated correctly in the live database. See "Phase 6" notes below the tracker for what's still open for a real production launch (Vercel env vars, a production webhook endpoint).
- **Phase status:** In progress — see tracker
- **Overall completion:** ~7 / 9 phases complete (0–8 plus the new 4.5, per plan-execution-claude-code.md + phase-4-6-revision.md).
- **Stack confirmed:** Next.js 16 (App Router) + TypeScript · Prisma 7 · Postgres/Supabase (Auth + RLS) · Tailwind + shadcn/ui · Inngest · Twilio · Sentry · **Stripe** (`stripe` npm package added 2026-08-23, gate passed same day) — passkit-generator still not added
- **Brand name:** Fidoo (confirmed — check trademark status below)
- **Last commits (as of last push):** `33c0fd1` (login page redesign), `0f5b785` (remaining dashboard + public pages redesign), `ecba7c2` (Campagnes redesign) — all pushed to origin/main, Vercel deploys automatically on push to main. Stripe work (this update) is about to be committed.

---

## Phase Tracker

| Phase | Name | Status | Gate Passed? | Notes |
|---|---|---|---|---|
| 0 | Skeleton | ✅ Done | ✅ | Deployed to Vercel |
| 1 | Multi-tenant + RLS | ✅ Done | ✅ | RLS enforced, isolation test exists |
| 2 | Customer ID + points loop | ✅ Done | ✅ | customers/events tables, append-only journal, QR scan flow |
| 3 | Dashboard v1 | ✅ Done | ✅ | Superseded in practice by "Dashboard v2" (unplanned rebuild, see Deviations) |
| 4 | Staff PWA + wallet-lite (revised, replaces original "Wallet passes") | ✅ Done | ✅ | See phase-4-6-revision.md. Staff roster (`/dashboard/staff`), PIN-based counter console (`/staff/[establishmentId]`), cooldown + staff attribution on events, owner-only reversal, per-customer installable manifest on `/card/[id]`. Arnold tested end-to-end on a real device 2026-08-23 and confirmed it works. |
| 4.5 | Real Apple/Google Wallet issuance (new, deferred) | ⚠️ Deferred | ☐ | Explicitly not started — waits for Phase 4 gate + a pilot request or Arnold's go-ahead, per phase-4-6-revision.md |
| 5 | Win-back + attribution | ✅ Done | ✅ | Inngest nightly job, Twilio SMS, attributed_return logic, revenue widget |
| 6 | Stripe billing | ✅ Done (test mode) | ✅ | Arnold chose to start this now rather than wait for the original "pilot ready to convert" trigger (see phase-4-6-revision.md). Schema migrated, checkout/portal/webhook code built and tested (80/80 tests), and a real end-to-end test-mode Checkout run completed 2026-08-23 — webhook confirmed received and processed. **Test mode only** — going live (real card payments) needs Vercel env vars + a production webhook endpoint, see "Phase 6 — Stripe billing" notes below. |
| 7 | GDPR | ✅ Done | ✅ | Right-to-erasure, audit log, legal pages |
| 8 | Pre-launch | 🟡 Partial | ☐ | Sentry + Dependabot wired; backup-restore test and real pilot accounts NOT evidenced |

---

## Phase 6 — Stripe billing (gate passed, test mode)

**Decision:** single paid plan, "Standard" at 49€/month — Arnold chose this over the multi-tier Starter/Growth/Pro split mentioned in some planning docs, to keep the first implementation simple. Multi-tier can be added later without a schema change (`Establishment.plan` is a plain string, not a fixed enum).

**Gate passed 2026-08-23:** Arnold created a real Stripe account (test mode) and a "Standard" Product/Price (49€/mo). Claude Code installed the Stripe CLI (`winget install Stripe.StripeCli`) and ran the agent-driven non-interactive login flow (`stripe login --non-interactive` → Arnold approved the pairing code in his browser → `stripe login --complete`). With `STRIPE_SECRET_KEY` and `STRIPE_STANDARD_PRICE_ID` in `.env.local` and `stripe listen --forward-to localhost:3100/api/webhooks/stripe` running locally (its printed secret as `STRIPE_WEBHOOK_SECRET`), Arnold ran a real Checkout on `localhost:3100/dashboard/settings` with Stripe's test card (`4242 4242 4242 4242`). The `checkout.session.completed` webhook was received and returned `200` (confirmed in the `stripe listen` log), and the establishment's `plan`/`billingStatus`/`stripeCustomerId` updated correctly — this is the plan-execution-claude-code.md gate criterion, satisfied.

**Built (2026-08-23):**
- `stripe` npm package added.
- `Establishment` migrated with `billingStatus`, `stripeCustomerId` (unique), `stripeSubscriptionId` (unique) — migration `20260823220000_establishment_billing`, applied to the live Supabase DB with Arnold's explicit confirmation per this repo's rule on existing-table migrations. `billingStatus` deliberately mirrors Stripe's own subscription status string (`active`/`past_due`/`canceled`/...) directly rather than a translated enum, since Stripe is the source of truth for billing state — same non-destructive philosophy as the events log, just for a different kind of state.
- `lib/stripe/client.ts` — lazy client getter (throws if `STRIPE_SECRET_KEY` missing), mirrors the existing `lib/twilio/client.ts` pattern.
- `lib/stripe/checkout.ts` — pure, unit-tested builders for Checkout/Portal session params (reuses the existing Stripe customer if there is one, falls back to `customer_email` for first-time subscribers).
- `lib/stripe/webhook.ts` — pure event handler (`handleStripeEvent`), integration-tested against the real seeded test DB: `checkout.session.completed` activates the establishment, `invoice.payment_failed` marks `past_due` without touching `plan` (Stripe's own dunning flow drives the eventual downgrade via `customer.subscription.updated`), `customer.subscription.deleted` reverts `plan` to `"pilote"` **without deleting anything** (establishment/customers/events untouched, same pattern as GDPR erasure).
- `app/api/webhooks/stripe/route.ts` — the sanctioned route-handler exception for external webhooks (per CLAUDE.md), verifies the signature via `stripe.webhooks.constructEvent`, rejects missing/invalid signatures with 401 (explicit acceptance criterion from plan-execution-claude-code.md, covered by `route.test.ts`).
- `app/dashboard/settings/{page,actions}.tsx` — new "Paramètres" page (nav item's `soon: true` flag removed), shows current plan/billing-status badge, "Passer au plan payant" (Checkout) or "Gérer mon abonnement" (Customer Portal) depending on state. Built in the soft/tactile style from the start — no separate redesign pass needed later.
- Deliberately **not** built yet: any actual feature-gating/enforcement based on plan. The phase doc left "what enforcement means" as an open decision; building the billing plumbing first without picking artificial restrictions to bolt on seemed safer than guessing what should be limited for pilots currently using the app for free.
- Tests: 11 new (Vitest), all passing alongside the existing 69 (80/80 total). `tsc --noEmit` clean.

**Still open — not blocking the gate, but needed before this works in production:**
- `.env.local` has real test-mode secrets now (`STRIPE_SECRET_KEY`, `STRIPE_STANDARD_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`) — gitignored, never committed, all documented (names only) in `.env.example`. The `STRIPE_WEBHOOK_SECRET` currently in `.env.local` is from the **local** `stripe listen` CLI session — it is NOT valid for production and will need to be replaced.
- **Vercel env vars**: `STRIPE_SECRET_KEY` and `STRIPE_STANDARD_PRICE_ID` need to be added to the Vercel project settings before the deployed site's billing feature works at all (right now it would throw "not configured" in production).
- **Production webhook endpoint**: needs a permanent endpoint created in the Stripe Dashboard (Developers → Webhooks → Add endpoint) pointing at `https://<production-domain>/api/webhooks/stripe`, subscribed to at least `checkout.session.completed`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted` — that endpoint's own signing secret goes into Vercel as `STRIPE_WEBHOOK_SECRET` (different from the local one).
- Not yet manually tested: `invoice.payment_failed` (e.g. via `stripe trigger invoice.payment_failed`) and `customer.subscription.deleted` — covered by integration tests (`lib/stripe/webhook.test.ts`) against real logic, but not yet exercised through a real Stripe event locally the way `checkout.session.completed` was.
- Going **live** (real cards, real money) is a separate, deliberate later step: swap `sk_test_...`/webhook secret for live-mode equivalents, and Stripe will require full business verification (bank details, business info) before live mode activates.
- Still deliberately not built: plan-based feature-gating/enforcement (see "Built" section below) and multi-tier plans.

---

## Frontend / Design Status

Direction: **"soft & tactile"** — warm off-white, rounded-24-28px cards with real shadow depth (not hairline borders), coral pill buttons/badges, Bricolage Grotesque (headings) + Nunito Sans (body), real logo everywhere. Chosen by Arnold after comparing 4 options on a design canvas (a "precise & structural" direction was built and shipped first, then explicitly rejected — "I don't like it, propose some other styles"). Fonts are wired globally via `app/layout.tsx` + `app/globals.css` (`--font-heading`/`--font-sans`), so any new page automatically gets the right typography — only the per-component card/button styling needs manual conversion.

**Done, live in production:**
- Logo (real asset, not the old hand-drawn approximation) — header, sidebar, login, onboarding, favicon/app icon (`public/brand/`, `components/logo.tsx`)
- Landing page (`app/page.tsx` + `components/landing/*`)
- Dashboard shell: sidebar nav, establishment switcher (`app/dashboard/layout.tsx`, `components/dashboard/sidebar-nav.tsx`, `components/dashboard/establishment-switcher.tsx`)
- Vue d'ensemble / overview page: KPI cards, activity chart, activity feed, period selector (`app/dashboard/page.tsx` + `components/dashboard/{kpi-card,activity-chart,activity-feed,period-select}.tsx`)
- `/dashboard/customers` (list: pill filters/sort, rounded table card) + `/dashboard/customers/[id]` (detail: stat cards, history feed) + the Delete/Reverse-visit dialog trigger buttons
- `/dashboard/campaigns` (suggestion cards + campaign history feed)
- `/dashboard/wallet` (card editor — `components/dashboard/wallet/wallet-editor.tsx`; the actual `WalletCard`/`PhoneFrame` pass-preview components were deliberately left as-is, since they mimic a real Apple/Google Wallet pass rather than the app's own dashboard chrome, and are already shared with the landing page's hero preview)
- `/dashboard/qr-nfc` (QR card + NFC status card + join steps)
- `/dashboard/loyalty` (stamp-card preview + program rules)
- `/dashboard/staff` (roster management)
- `/dashboard/scan` (camera/manual lookup → register → confirm flow)
- `/dashboard/audit` (journal table, same pattern as Clients)
- `/onboarding` wizard (5-step, standalone full-page), `/join/[establishmentId]` + `/join/[establishmentId]/welcome` (public join flow), `/card/[id]` (public installable customer card), `/staff/[establishmentId]` (Staff PWA counter console — PIN pad + the same scan/lookup/register flow as `/dashboard/scan`)

All converted 2026-08-23 (night), visually confirmed by Arnold on `localhost:3100` the same night, then committed and pushed.

- `/login` — converted 2026-08-23 (night).

**Still stale**: `public/landing-dashboard-preview.png` (the screenshot embedded in the landing page) still shows the *old* dashboard style. Re-capturing it needs a real authenticated screenshot at 1440×900 of `/dashboard`, which needs either working Supabase credentials handed to Claude Code for a headless-browser capture, or Arnold capturing it himself and sending the file — deliberately skipped for now (2026-08-23), Arnold's call to revisit.

---

## What Works End-to-End Right Now

- [x] Auth (Supabase) → dashboard, scoped per establishment via RLS + `asEstablishmentUser`
- [x] Full loyalty loop: QR scan or manual phone entry → consent capture → visit/points events → live balance computed from event log
- [x] Public unauthenticated flows: `/join/[establishmentId]` (self-join) and `/card/[id]` (customer card view)
- [x] Dashboard v2: customer list with VIP/new/risk/active classification, search/filter, KPI cards, activity chart, campaign history with attributed revenue
- [x] Win-back automation: nightly Inngest detection → Twilio SMS → 14-day return attribution → revenue widget
- [x] GDPR: erasure (SET NULL on events, preserves aggregates), audit log, legal pages
- [x] Sentry + Dependabot live
- [x] Customer self-tap loop (2026-08-31): NFC tag/QR at the till opens `/tap/[establishmentId]` → recognized device gets an instant stamp (animated card), new customer does a 10-second signup then gets stamped; same 2h cooldown as staff validation; events tagged `source: "self_tap"` in the journal

---

## In Progress

- **Current task:** Frontend redesign pass — **done**. Every sidebar page plus onboarding/public flows are converted, confirmed, committed, and pushed. Only `/login` remains in the old style (out of scope this session).
- **Blocked on:** nothing. Stripe (Phase 6) and real Wallet issuance (Phase 4.5) remain untriggered/deferred as before.
- **Next logical step:** Arnold chose to start Phase 6 (Stripe billing) next, with Claude Code walking him through every setup step (Stripe account, API keys, webhook, env vars) since this is new territory for the project. Re-capturing `public/landing-dashboard-preview.png` was explicitly deferred (needs an authenticated screenshot Arnold or working credentials would have to provide). Phase 8 gaps (backup/restore test, first real pilot) remain open and still need Arnold directly.

---

## Deviations from the Original Plan

| Date | Original plan said | What was actually built | Reason |
|---|---|---|---|
| 2026-08 | Phase 3 = Dashboard v1, then move to Phase 4 | Phase 3 was substantially rebuilt as "Dashboard v2" (new shell, Campaigns/QR-NFC/Wallet/Loyalty pages, branding polish) — not itemized in plan-execution-claude-code.md | Unplanned scope growth; not wrong, but wasn't gated as its own phase |
| 2026-08 | Phase 4 = working Apple/Google Wallet pass issuance | Built only a visual card-appearance editor/preview; no .pkpass generation, no passkit-generator dependency | Deferred — matches the Fidoo Product Strategy doc's own advice to not overbuild Wallet/NFC before validating other things, but wasn't an explicit decision logged anywhere until now |
| 2026-08 | "Never advance phases before isolation tests pass" | Phase 8 pre-launch items (Sentry, Dependabot) shipped while Phase 6 (Stripe) has zero progress | Worth Arnold's attention — not necessarily wrong, but breaks the sequential-gate discipline the plan explicitly calls for |
| 2026-08-23 | Original Phase 4 = one monolithic "Wallet passes" phase, before Phase 6 | Replaced by phase-4-6-revision.md: split into Phase 4 (Staff PWA + wallet-lite, no real issuance) and Phase 4.5 (real Apple/Google Wallet issuance, deferred until a pilot needs it or Arnold greenlights it); Phase 6 (Stripe) resequenced to trigger on a real pilot converting to paid rather than a fixed phase order | Real `.pkpass` issuance is higher-effort/lower-urgency than getting the anti-fraud validation loop working; unblocks pilot onboarding sooner. See phase-4-6-revision.md for full reasoning. |
| 2026-08-23 | phase-4-6-revision.md said staff auth would be "PIN-based, not a full Supabase account per employee" | Implemented as a separate `StaffMember` roster table (own UUID, no Supabase auth.users row) rather than any EstablishmentUser variant — because `EstablishmentUser.id` is hard-FK'd to `auth.users`, so it can never NOT be a real Supabase account. The device running the Staff PWA still authenticates via the existing owner/Supabase session (RLS unchanged); the PIN only selects/attributes which `StaffMember` performed an action, it is not a second auth system. Matches the project's "Supabase Auth never homemade" rule. | This was flagged as an explicit open question before starting; resolved by design rather than by asking again, since the FK constraint made the answer unambiguous. |
| 2026-08-23 | phase-4-6-revision.md: Phase 6 (Stripe) triggers on "a specific establishment ready to convert from pilot to paid," not a fixed order | Arnold chose to start Phase 6 immediately after finishing the frontend redesign pass, with no pilot yet in a convert-to-paid situation | Arnold's call — getting the billing plumbing built and tested ahead of time isn't wrong, just earlier than the original trigger condition. Also decided the plan structure while at it: one plan (Standard, 49€/mo) rather than the multi-tier Starter/Growth/Pro split floated elsewhere in the docs, to keep the first build simple. |

---

## Architecture / Schema Changes

- **Multi-tenant RLS model:** unchanged from plan — RLS enforced, isolation test exists.
- **Event log / ledger:** unchanged in principle (append-only, source of truth). Implementation detail: `Event.customerId` is nullable with `onDelete: SetNull` (not cascade) — erasure removes the Customer row but keeps event rows so aggregate stats don't develop holes. `type` is Zod-validated at the Server Action boundary rather than a DB enum.
- **Establishment:** added `averageBasketCents` (nullable), beyond original Phase 1 field list, to support Phase 5 revenue attribution.
- **EstablishmentUser.id:** explicitly set to Supabase `auth.uid()` (not autogenerated), FK'd into `auth.users`.
- **Customer:** unique on `(establishment_id, phone)`.
- **AuditLog (Phase 7):** append-only, tracks `viewed_customer` / `erased_customer`.
- **New interfaces vs. original scope:** Wallet, QR-NFC, Campaigns, and Loyalty pages added to the dashboard (Dashboard v2) — partially anticipates the Fidoo Product Strategy doc's multi-interface direction. The **Fidoo Staff PWA** is now built: `/staff/[establishmentId]` (PIN pad → scan/validate console, reuses the existing camera+manual-entry pattern from `/dashboard/scan`) and `/dashboard/staff` (owner-side roster management).
- **New table `staff_members`:** `establishment_id`, `name`, `pin_hash` (scrypt, salted, via Node's built-in `crypto` — no new dependency), `active`. RLS scoped like `customers`; no DELETE policy — staff are deactivated (`active = false`), never deleted, so historical event attribution never dangles.
- **`events` table altered (existing-table migration, confirmed with Arnold first per CLAUDE.md):** added nullable `staff_id` → `staff_members.id`, `ON DELETE SET NULL` — same non-destructive pattern as `customer_id`. Migration: `prisma/migrations/20260823120000_staff_members/`.
- **New event type `points_reversed`:** owner-only correction for a mis-scanned/duplicate staff validation — inserts a new event referencing the original (`metadata.reversedEventId`), never edits or deletes it. `computeBalance` treats it as a subtraction, same as `reward_redeemed`.
- **Cooldown = idempotency guard:** a staff-validated visit blocks a second credit to the same customer for 2 hours (`STAFF_VALIDATION_COOLDOWN_MS` in `lib/staff/validate.ts`), regardless of which staff member triggers it. This single mechanism covers both "don't double-credit one visit" and "don't double-submit on a flaky connection" — no separate idempotency-key table.
- **Wallet-lite, not real Wallet:** `/card/[id]` now serves its own per-customer manifest (`/card/[id]/manifest.json`, not the shared `/manifest.json`) so "Add to Home Screen" reopens that exact customer's card. No `.pkpass`, no push updates — balance freshness comes from the page being plain SSR with no cache directive, so a manual reopen/refresh is already current.
- Migrations incremental and descriptively named; no destructive/reverted migrations seen.

---

## Known Issues / Bugs

| Issue | Severity | Status |
|---|---|---|
| No Stripe integration — no plan-gating/billing enforcement | High | Blocks monetizing real pilots |
| QR page still has "Bientôt disponible" stubs (download/print QR poster); NFC stub replaced 2026-08-31 by the real tap link + write-a-tag instructions | Low | Intentional, not broken |
| Self-tap replay: the tap URL is static, so a bookmarked link can re-stamp from home once per 2h cooldown window | Low-Med | Accepted for v1 (same trade-off as budget tap-loyalty products); TapStamp-style short-lived challenge tokens or NTAG 424 rotating URLs are the upgrade path if pilots see abuse. Events are tagged `source: "self_tap"` so abuse is visible and reversible in the journal |
| `gh` CLI not installed; npm/npx need PATH refresh after Node install via winget | Low | Dev-environment annoyance only |
| No tested Supabase backup/restore | Medium | Runbook ready (`BACKUP_RESTORE_RUNBOOK.md`) — Arnold still needs to actually run it once in the Supabase dashboard |
| No real pilot establishment accounts yet | Medium | Onboarding is now scripted (`scripts/onboard-pilot.ts` + `PILOT_ONBOARDING.md`) — still needs Arnold to have a real establishment ready and the one-time service-role-key + email-delivery prerequisites set up |
| Vercel may look stale after push | Low | Build succeeds locally — check Deployments tab against the latest commit; likely propagation/cache lag |
| Staff PWA session doesn't persist between page loads | Low | Re-entering a PIN after every reload is intentional-for-now scope-tightening, not a bug, but may annoy staff mid-shift — revisit if it's a real friction point after the first pilot |
| `public/landing-dashboard-preview.png` shows the old dashboard style | Low | Stale screenshot embedded in the landing page — needs an authenticated 1440×900 capture of `/dashboard`; deliberately skipped 2026-08-23 (needs either credentials handed to Claude Code or Arnold capturing it himself) |
| Supabase's `/auth/v1/user` endpoint intermittently hangs 60s+ with no response | Medium | Reproduced with raw `curl`, independent of the app — not a Supabase-side incident (checked their status page). Mitigated 2026-08-23: every Supabase client (`lib/supabase/{proxy,server,client}.ts`) now has an 8s fetch timeout (`lib/supabase/fetch-with-timeout.ts`), so a network blip fails fast instead of hanging the whole app for minutes. Root network cause is still unexplained — worth revisiting if it recurs. |

---

## Fidoo-Specific Open Items (from Product Strategy doc)

Tracks the "points to validate before full development" list from the Fidoo strategy doc:

- [ ] Apple Wallet NFC prototype validated (entitlement/certificate, read flow, pass update)
- [ ] Google Wallet Smart Tap constraints validated (Collector ID, partner terminals)
- [ ] Universal pass vs. per-restaurant pass UX tested with real users
- [ ] QR → account → Wallet conversion rate measured
- [ ] Staff flow speed-tested at peak hours
- [ ] Consent / data controller responsibilities / cross-restaurant data use reviewed for GDPR
- [x] Anti-fraud rules implemented as acceptance criteria: staff validation required, PIN per employee, cooldown, idempotency key, immutable ledger with reversal entries — built 2026-08-23 (`lib/staff/validate.ts`, `lib/loyalty/reversal.ts`); cooldown doubles as the idempotency guard rather than a separate key. Not yet stress-tested at real peak-hour volume.

---

## Trademark / Brand Status

- **Name:** Fidoo
- **BOIP search:** [not started / in progress / clear / conflict found]
- **EUIPO search:** [not started / in progress / clear / conflict found]
- **Domain(s) secured:** [list]
- **Notes:**

---

## Change Log (append-only, most recent first)

### 2026-08-31 (later) — Card customization by the establishment + reward redemption loop
- Arnold asked to "enhance Fidoo", specifically that the restaurant decides how the card looks. Built:
- **New table `loyalty_programs`** (one row per establishment, lazily created on first save): `goal` (stamps for reward), `reward_label`, `card_color`, `text_color`, `stamp_icon`. RLS policies (SELECT/INSERT/UPDATE, no DELETE) in the same migration per CLAUDE.md; readers fall back to shared defaults (`lib/loyalty/program.ts` `DEFAULT_PROGRAM`) when the row is absent, so nothing breaks for establishments that never touch the editor. Migration `20260831120000_loyalty_programs` was initially blocked by the permission classifier (writes to the live Supabase DB); **applied cleanly after Arnold's explicit "yes I approve"** — new table only, no existing table touched.
- **`/dashboard/loyalty` is now a real editor** (the "Modifier le programme" stub is gone): goal chips (6/8/10/12), reward label, card/text color (reusing `ColorField` + presets from the wallet editor), a 10-icon curated stamp-icon picker (`components/loyalty/stamp-icons.ts`), live preview of the exact customer card, dynamic program-rules summary. Server Action `saveProgram` Zod-validates (`programInputSchema`: hex colors, icon allowlist, goal 4–30) and upserts RLS-scoped.
- **Custom design applied everywhere the customer sees the card**: `/card/[id]` (header color/text color, icon, accent, reward label), the `/tap` result card, and the `/join/.../welcome` preview. `StampProgress` gained `icon`/`accentColor` props and an adaptive grid (5/4/3 columns by divisibility); defaults unchanged.
- **Reward redemption exists now** — previously `reward_redeemed` was only a display label with no way to create one; a full card could never be redeemed. New `lib/loyalty/redeem.ts`: checks balance ≥ goal and inserts the immutable `reward_redeemed` event in one transaction (double-submit safe), snapshotting `{ points: goal, rewardLabel }` into metadata so later goal changes never rewrite what an old redemption cost. Wired into BOTH counters: Staff PWA (`staffRedeemReward`, staff-attributed, "Offrir la récompense" when the card is full — including right after the visit that fills it) and owner-side `/dashboard/scan` (`ownerRedeemReward`, no staff attribution). Lookup/validate results now show `balance / goal` and the reward name.
- Tests written alongside: `program.test.ts` (defaults, upsert, public read, RLS isolation from café B, schema validation) and `redeem.test.ts` (insufficient, snapshot metadata + staff attribution, double-redeem blocked, custom goal/label honored); `publicCard.test.ts` updated for the extended card shape. **97/97 tests pass** after the migration, `tsc --noEmit` clean.
- E2e-verified in a real headless browser: seeded a custom program (dark card, croissant icon, goal 8, "un café offert") for the test café, ran the full tap signup → stamp flow, and confirmed the custom design renders on both the tap result and `/card` (screenshots checked visually; test data cleaned up afterward). Caught and fixed a real French copy bug in the process: `StampProgress` said "avant votre un café offert" — now detects labels that carry their own article and drops the "votre". The dashboard editor itself needs Arnold's manual review on `localhost:3100/dashboard/loyalty` (no working login credentials for automated dashboard checks, per the established review loop).
- Not committed — pending Arnold's review.

### 2026-08-31 — Customer self-tap "tap & stamp" flow (TapStamp-style, original implementation)
- Arnold asked to "reverse engineer the tap stamp app from the UK" — identified as TapStamp (tapstamp.co.uk): NFC pod at the till, customer taps their phone, a web page opens (no app), a stamp is added instantly. Researched their publicly documented flow and rebuilt the *experience* as an original Fidoo implementation (no code/assets copied), in the soft/tactile style.
- New public route `/tap/[establishmentId]` — the URL to write on an NFC tag or print as QR at the till. Recognized device (per-establishment httpOnly cookie holding the customer's own card UUID, ~13-month maxAge) → instant stamp with an animated card fill. Unknown device → 10-second signup (phone, optional first name, optional SMS-consent checkbox, privacy link) → first stamp. Cooldown → "Visite déjà comptée, revenez après HH:MM". Full card → "Récompense débloquée, montrez cet écran au comptoir". GET is side-effect free; the stamp is a Server Action fired on mount (prefetchers/crawlers can't stamp), Strict-Mode double-fire guarded client-side, real double-taps guarded server-side by the cooldown.
- New `lib/loyalty/selfTap.ts`: same immutable `visit` + `points_added` event pair as staff validation, `staffId` null, `metadata.source = "self_tap"` for attribution/reversal; shares the 2h cooldown constant with staff validation (one visit = one stamp regardless of channel, either channel's visit arms the cooldown for both); win-back `maybeAttributeReturn` still fires. Public unauthenticated WRITE, deliberately outside `asEstablishmentUser`/RLS — same bearer-UUID trust model as `publicCard.ts`, write narrowly scoped to the verified (customer, establishment) pair; documented in-code. `selfJoinAndTap` upserts by (establishment, phone) with `update: {}` so an existing customer's name/consent are never overwritten by a tap signup; consent optional, `consentChannel: "self_tap"` only when ticked. **No schema change, no migration** — event `type` is Zod/app-validated, not a DB enum.
- `/dashboard/qr-nfc`: NFC stub replaced with the real per-establishment tap link — QR preview, copy button, and write-it-to-a-tag instructions (NTAG213+, e.g. "NFC Tools" app); steps card rewritten for the tap flow. `StampProgress` gained an optional `popIndex` prop (newly earned stamp zooms in); default rendering unchanged for `/card` and `/dashboard/loyalty`.
- Tests written alongside per CLAUDE.md: 10 new Vitest integration tests (`lib/loyalty/selfTap.test.ts`) — not_found/isolation, self_tap tagging, cooldown both directions (staff visit blocks self-tap), post-cooldown re-stamp, consent semantics, existing-customer no-overwrite. 90/90 total passing, `tsc --noEmit` clean. Also e2e'd in a real headless browser against the dev server: signup → stamp → reload → recognized + cooldown → card link, screenshots verified visually; e2e customers cleaned from the DB afterward. Fixed a Base UI `nativeButton` warning on the link-rendered button along the way.
- Known trade-off logged under Known Issues: the tap URL is static, so replay-from-home is possible once per cooldown window — accepted for v1, upgrade path is TapStamp's short-lived challenge tokens or NTAG 424 rotating URLs.
- **Not committed** — working tree only, pending Arnold's review, per this repo's convention.

### 2026-08-23 (night, Phase 6 gate passed) — Real Stripe test-mode Checkout completed end-to-end
- Arnold set up a real Stripe account (test mode), created a "Standard" Product/Price (49€/mo), and shared the test-mode secret key + Product ID.
- Claude Code looked up the actual Price ID via the Stripe API directly (Arnold had sent the Product ID, not the Price ID — Checkout needs the latter), installed the Stripe CLI (`winget install Stripe.StripeCli`, package ID is `Stripe.StripeCli` not the more obvious `stripe.stripe-cli`), and completed authentication via the CLI's agent-driven non-interactive flow: `stripe login --non-interactive` prints a pairing URL/code, Arnold approved it in his browser, Claude Code then ran `stripe login --complete` to finish. No manual credential entry needed on Claude Code's side beyond the secret key Arnold already shared.
- Wired `.env.local` with `STRIPE_SECRET_KEY`, `STRIPE_STANDARD_PRICE_ID`, and (after starting `stripe listen --forward-to localhost:3100/api/webhooks/stripe`) `STRIPE_WEBHOOK_SECRET`. Confirmed the webhook route's behavior changed correctly once configured (500 "not configured" → 401 "missing signature").
- Arnold ran a real Checkout on `/dashboard/settings` with Stripe's `4242...` test card. Confirmed in the `stripe listen` log: `checkout.session.completed` received and returned `200`. This satisfies the phase's actual gate criterion (a real establishment completing Checkout end-to-end in test mode) — **Phase 6 gate marked passed**, tracker updated.
- Explained clearly to Arnold throughout that test mode means no real money moves and the test card isn't a real card — he asked to confirm this before running the checkout, which was the right thing to double check before entering "payment" details into any form, even Stripe's own.
- Local processes (dev server, `stripe listen`) stopped cleanly afterward; `.env.local` changes are gitignored and were never committed. What remains for a real production launch (Vercel env vars, a production webhook endpoint, live-mode keys) is documented in the "Phase 6" section above, not yet done.

### 2026-08-23 (night, Stripe scaffolding) — Phase 6 billing plumbing built and migrated
- Decision: single "Standard" plan at 49€/mo (Arnold's choice, over the multi-tier split floated in some docs) — see the new Deviations row.
- Added `stripe` npm dependency. New: `lib/stripe/{client,checkout,webhook}.ts`, `app/api/webhooks/stripe/route.ts` (signature-verified, 401 on missing/invalid signature), `app/dashboard/settings/{page,actions}.tsx` (new billing UI, built soft/tactile from the start; removed its `soon: true` nav flag).
- **Existing-table migration** `20260823220000_establishment_billing` (adds `billing_status`, `stripe_customer_id`, `stripe_subscription_id` to `establishments`) — shown to Arnold in full before running, per this repo's rule; Arnold confirmed, migration applied cleanly to the live Supabase DB via `prisma migrate deploy` (not `migrate dev`, since this project's shadow-DB diffing has always failed against Supabase's `auth` schema — same reason every prior migration in this repo was hand-written rather than autogenerated).
- Tests written alongside the code (per CLAUDE.md): 11 new — pure unit tests for the Checkout/Portal param builders, integration tests for `handleStripeEvent` against the real seeded test DB (activation, `past_due` on payment failure, non-destructive downgrade on cancellation), and route-level tests for the signature-rejection acceptance criterion from plan-execution-claude-code.md. 80/80 total passing, `tsc --noEmit` clean.
- Deliberately scoped out: any plan-based feature-gating/enforcement — the phase doc left "what enforcement means" open, and picking arbitrary restrictions to bolt on without a real product decision felt worse than just shipping the billing plumbing first.
- **Not yet committed** — working tree only, pending Arnold's review. Also not yet gate-passed: still needs Arnold's real Stripe test-mode key + a Price ID + one real end-to-end Checkout run, per the phase's actual gate criterion. See "Phase 6 — Stripe billing" section above the Frontend/Design Status block for the full checklist.

### 2026-08-23 (night, truly final) — Frontend redesign: /login converted; screenshot re-capture deferred
- Converted `/login` to the "soft & tactile" style (full-page warm background, rounded-[24px] card, rounded-full submit button with the coral CTA shadow) — the one page explicitly left out of the previous pass. `tsc --noEmit` clean, 69/69 tests pass.
- Arnold was offered three ways to get a fresh authenticated `/dashboard` screenshot for `public/landing-dashboard-preview.png` (hand over working credentials again, capture it himself and send the file, or skip) and chose to skip for now — deferred, not forgotten.
- The redesign pass is now complete except that one screenshot. Arnold is moving on to Phase 6 (Stripe billing) next.

### 2026-08-23 (night, final) — Frontend redesign: the whole rest of the dashboard converted
- Converted all 10 remaining pages in one continuous pass, per Arnold's request to stop pausing for review after each one: `/dashboard/wallet` (card editor — `components/dashboard/wallet/wallet-editor.tsx`), `/dashboard/qr-nfc` (+ `components/dashboard/qr-nfc/join-qr-code.tsx`), `/dashboard/loyalty`, `/dashboard/staff` (+ `StaffRoster.tsx`), `/dashboard/scan` (+ `CardQrCode.tsx`), `/dashboard/audit`, the `/onboarding` wizard (`components/onboarding/onboarding-wizard.tsx`), `/join/[establishmentId]` + `/join/[establishmentId]/welcome`, `/card/[id]`, and `/staff/[establishmentId]` (Staff PWA — `StaffConsole.tsx`, which shares the same scan/lookup/register flow as `/dashboard/scan`). Same established pattern throughout: rounded-[22–24px] white cards, `boxShadow: "0 14px 28px -10px rgba(74,64,56,0.1)"`, warm text palette, rounded-full pill buttons, per-component `className`/`style` overrides only — no changes to `components/ui/*`.
- Deliberately left `WalletCard`/`PhoneFrame` (`components/wallet-card.tsx`, `components/phone-frame.tsx`) unstyled by this pass — they render a mockup of the actual Apple/Google Wallet pass the customer would see, not the app's own dashboard chrome, and are already shared with the already-shipped landing-page hero preview.
- Standalone pages outside the dashboard shell (onboarding, join, welcome, card, Staff PWA) got the same full-page warm background (`style={{ background: "#FBF6EF" }}`) already established on the landing page and dashboard shell, since they don't inherit it from a shared layout.
- `/login` was deliberately left in the old style — outside what was asked this session.
- Verified: `tsc --noEmit` clean, 69/69 tests, dev server smoke-tested every route (all dashboard routes correctly redirect unauthenticated to `/login`; `/join`/`/card` return a clean 404 for a nonexistent id rather than a 500) — no crashes anywhere. Arnold then reviewed all of it live on `localhost:3100` and confirmed it looks right before this was committed and pushed.

### 2026-08-23 (night, later still) — Frontend redesign: Campagnes converted; Clients mobile fix
- Converted `/dashboard/campaigns` to the "soft & tactile" style: header button and suggestion cards (`components/dashboard/campaigns/suggestion-card.tsx`) rebuilt with rounded-[22px] white cards/soft shadows/warm palette, feature icon chips switched from `rounded-full` to `rounded-2xl` to match the established feature-icon convention (person avatars stay `rounded-full`, feature icons are `rounded-xl`/`rounded-2xl`), and the campaign history rebuilt as a single divided list inside one card (mirroring the Clients history pattern) instead of one bordered `Card` per campaign. Verified: `tsc --noEmit` clean, 69/69 tests, visually confirmed by Arnold on `localhost:3100`.
- Also fixed a real mobile bug found while auditing the Clients pages for phone-width rendering: the customer detail page header (`app/dashboard/customers/[id]/page.tsx`) had the avatar/name block and the two action buttons sharing one non-wrapping flex row — on a phone-width screen they'd squeeze together and clip. Now stacks vertically below the `sm` breakpoint. Committed separately (`f1647fc`).
- Note on process: attempted an automated headless-browser mobile check (Playwright + cached Chromium) using temporary credentials Arnold provided, but login failed against this environment's Supabase project and Arnold asked to drop it rather than keep retrying — no credentials were saved anywhere. Verification for both pages ended up being Arnold checking `localhost:3100` directly, which is now the established loop: convert → `tsc`/tests → dev server → Arnold reviews → commit → push.
- Local dev note: hit a Turbopack crash (`0xc0000142`, DLL init failure spawning a PostCSS worker process) after several manual dev-server restarts/force-kills this session — resolved by deleting the `.next` cache directory. Worth remembering if `next dev` fails the same way again: stale Turbopack cache after an ungraceful stop, not a code issue.
- Arnold asked to stop pausing for review after every single page and instead convert the remaining sidebar pages (Wallet, QR & NFC, Fidélité, Équipe, Scanner, Journal d'accès) back-to-back.

### 2026-08-23 (night, later) — Frontend redesign: Clients page converted
- Converted `/dashboard/customers` (list) and `/dashboard/customers/[id]` (detail) to the "soft & tactile" style, following the exact pattern established on the overview page: rounded-[22–24px] white cards with `boxShadow: "0 14px 28px -10px rgba(74,64,56,0.1)"` replacing hairline-bordered cards/table, coral pill filter chips replacing flat filter buttons, warm text palette (`#3A322B` headings / `#8A7D6C` secondary / `#B0A290` tertiary) replacing generic `text-foreground`/`text-muted-foreground`, and the customer history timeline rebuilt as a single divided list inside one card (mirroring `ActivityFeed`) instead of one bordered `Card` per event. Also rounded the Delete/Reverse-visit dialog trigger buttons to pills for consistency. No changes to `components/ui/*` primitives — same per-component `className` override pattern as before.
- Verified: `tsc --noEmit` clean, 69/69 Vitest tests pass, dev server starts and both routes correctly redirect unauthenticated requests to `/login` (no crash). Automated screenshot wasn't possible (no documented dev/test Supabase login credentials in this repo), so Arnold checked it live on `localhost:3100` and confirmed it looks right.

### 2026-08-23 (later night) — Frontend redesign: logo, landing page, dashboard shell + overview
- Real logo integrated everywhere (`public/brand/`, favicon/app icon), replacing the old hand-drawn SVG approximation.
- Landing page redesign went through two rounds: a "precise & structural" (Linear/Stripe-docs) direction was built and shipped first, then explicitly rejected by Arnold ("I don't like it, propose some other styles"). Built 4 comparison mockups on a design canvas (editorial/warm, bold/graphic, dark premium, soft/tactile); Arnold picked **soft & tactile**, built into the real page, committed as `f4e8209`.
- Extended the same direction to the dashboard: shared shell (sidebar, establishment switcher) and the Vue d'ensemble/overview page (KPI cards, activity chart, activity feed) — previewed on the same design canvas before building for real, approved, committed as `4496dfa`. Fonts (Bricolage Grotesque + Nunito Sans) consolidated to load globally instead of per-page.
- **Found and fixed a real reliability bug while debugging**, unrelated to the redesign itself: Supabase's `/auth/v1/user` endpoint was intermittently hanging 60s+ with zero response (reproduced with raw `curl`, outside Next.js — not a Supabase-side incident). Every Supabase client made an unbounded call to it, so a network blip froze the whole app. Added a shared 8s fetch timeout to all three clients (middleware, Server Components/Actions, browser) — worst case now bounded to ~8s instead of minutes. Also fixed a misleading "wrong password" error that was actually a network timeout, and a pre-existing Base UI console warning on 3 buttons.
- Remaining dashboard pages (Clients, Campagnes, Wallet, QR & NFC, Fidélité, Équipe, Scanner, Journal d'accès) are still in the old style — see "Frontend / Design Status" above for the exact list and the pattern to follow.
- Verified throughout: `tsc --noEmit` clean, 69/69 tests, production build compiles all 22 routes, and actually screenshotted in a real headless browser at each step (not just compiled) — including an automated real login round-trip to verify the reliability fix, not just a visual check.

### 2026-08-23 (night) — Backup/restore runbook + pilot onboarding script
- `BACKUP_RESTORE_RUNBOOK.md`: step-by-step for testing a Supabase restore into a throwaway scratch project (never onto the live one, since there's no separate staging environment) — includes RLS/policy verification, since a raw `pg_dump`/`pg_restore` can silently drop policies.
- `scripts/onboard-pilot.ts` + `PILOT_ONBOARDING.md`: replaces the hardcoded-id pattern in `prisma/seed.ts` for real establishments. Invites the owner via Supabase's official `inviteUserByEmail` (no homemade auth), then creates the `Establishment`/`EstablishmentUser` rows. Requires a one-time `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (not yet present — Arnold needs to add it before first use) and Supabase email delivery configured. Smoke-tested: missing-args and missing-service-role-key paths both fail cleanly before touching Supabase or the database.
- Neither closes its Known Issues row by itself — both still need Arnold to actually execute them (the restore test once; onboarding once a real pilot is ready).

### 2026-08-23 (evening) — Phase 4 gate passed
- Committed and pushed Phase 4 (revised) work as `0b5f8f3`.
- Arnold tested `/dashboard/staff` (added a real employee) and `/staff/[establishmentId]` (PIN pad + scan/validate) on a real device and confirmed it works — Phase 4 gate considered passed, tracker updated to ✅ Done.
- Phase 4.5 (real Wallet issuance) and Phase 6 (Stripe) remain deliberately untouched — neither has a trigger condition met yet (see phase-4-6-revision.md). Recommended next non-blocked work: Phase 8's remaining gaps (Supabase backup/restore test, first real pilot accounts) — both need Arnold directly, not more code.

### 2026-08-23 (later same day) — Phase 4 (revised) implementation
- Built Staff PWA + wallet-lite per phase-4-6-revision.md: new `staff_members` table (RLS-scoped, PIN hashed with Node's built-in `crypto.scrypt`), `events.staff_id` column (existing-table migration, confirmed with Arnold before applying), `lib/staff/{pin,roster,validate}.ts`, `lib/loyalty/reversal.ts`, owner-side roster page (`/dashboard/staff`), counter-facing PIN pad + scan console (`/staff/[establishmentId]`), owner-only "correct last point" action on the customer detail page, and a per-customer installable manifest on `/card/[id]`.
- Resolved the "PIN-based, not a full Supabase account" open question by design: `EstablishmentUser.id` is hard-FK'd to `auth.users`, so staff got their own non-auth table instead of a lightweight EstablishmentUser variant — RLS/Supabase Auth boundary is completely unchanged.
- Cooldown (2h) doubles as the idempotency guard, rather than building a separate dedupe-key mechanism — one less moving part for the same guarantee at this scale.
- Verified: 69/69 Vitest tests (11 new), `tsc --noEmit` clean, `next build` compiles all 24 routes. Caught and fixed one real bug pre-ship: `reverseLastVisit` was reading its own balance via a helper that opened a second transaction, so it saw pre-commit (stale) data — fixed by computing the balance inside the same transaction.
- **Not yet committed or pushed** — working tree only, pending Arnold's go-ahead per this repo's "only commit when asked" convention.
- Still open: real-device Phase 4 gate verification, Phase 4.5 (real Wallet) and Phase 6 (Stripe) both remain untouched by design.

### 2026-08-23
- First real status pull from Claude Code, synced into this file.
- Confirmed: Phases 0, 1, 2, 5, 7 done. Phase 3 quietly became "Dashboard v2" (unplanned scope). Phase 4 (Wallet) is stubbed/deferred — not built. Phase 6 (Stripe) not started. Phase 8 partially started out of sequence.
- Decision needed: Wallet vs. Stripe priority — see strategic chat for reasoning (pilots may not need real Stripe billing yet if still in free/discounted pilot phase per original pricing plan; Wallet issuance is closer to core product promise "no app download").
- Fidoo Staff PWA (from Fidoo Product Strategy doc) not yet reconciled into the execution plan — flagged as open item.

---
