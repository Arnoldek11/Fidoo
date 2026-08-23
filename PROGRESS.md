# Fidoo — Progress Log

> **Purpose:** This file is the single source of truth for project status. Claude Code updates it after every phase gate passes. Arnold pastes its contents into claude.ai (chat with strategic Claude) whenever he needs a status-informed conversation, review, or planning session.
>
> **Rule for Claude Code:** Update this file automatically right after a phase's validation gate passes — don't wait to be asked. Keep entries factual and concise. Never delete history; append.

---

## Snapshot (update this block every time)

- **Last updated:** 2026-08-23 (night, later)
- **Current phase:** All backend phases through 4/5/7 done (see tracker). Current work is a **visual redesign pass** ("soft & tactile" brand direction — real logo, Bricolage Grotesque + Nunito Sans, rounded cards with soft shadows, coral pill accents) rolling out page by page across the dashboard. Landing page + dashboard shell + Vue d'ensemble + Clients are done and confirmed; the rest of the dashboard (Campagnes, Wallet, QR & NFC, Fidélité, Équipe, Scanner, Journal d'accès) is still in the older flat/hairline shadcn style — see "Frontend / Design Status" below.
- **Phase status:** In progress — see tracker
- **Overall completion:** ~6.5 / 9 phases complete (0–8 plus the new 4.5, per plan-execution-claude-code.md + phase-4-6-revision.md). The redesign pass is a cross-cutting UI initiative, not one of the numbered phases.
- **Stack confirmed:** Next.js 16 (App Router) + TypeScript · Prisma 7 · Postgres/Supabase (Auth + RLS) · Tailwind + shadcn/ui · Inngest · Twilio · Sentry — **Stripe and passkit-generator not yet added**
- **Brand name:** Fidoo (confirmed — check trademark status below)
- **Last commits (as of last push):** `4496dfa` (dashboard restyle + Supabase client timeout resilience), `f4e8209` (real logo + soft/tactile landing page), `439441a`/`2b1e9b3`/`0b5f8f3` (Phase 4 revised) — all pushed to origin/main, Vercel deploys automatically on push to main.

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
| 6 | Stripe billing | ❌ Not started (resequenced) | ☐ | Trigger is now "a specific establishment ready to convert from pilot to paid," not a fixed phase order — see phase-4-6-revision.md |
| 7 | GDPR | ✅ Done | ✅ | Right-to-erasure, audit log, legal pages |
| 8 | Pre-launch | 🟡 Partial | ☐ | Sentry + Dependabot wired; backup-restore test and real pilot accounts NOT evidenced |

---

## Frontend / Design Status

Direction: **"soft & tactile"** — warm off-white, rounded-24-28px cards with real shadow depth (not hairline borders), coral pill buttons/badges, Bricolage Grotesque (headings) + Nunito Sans (body), real logo everywhere. Chosen by Arnold after comparing 4 options on a design canvas (a "precise & structural" direction was built and shipped first, then explicitly rejected — "I don't like it, propose some other styles"). Fonts are wired globally via `app/layout.tsx` + `app/globals.css` (`--font-heading`/`--font-sans`), so any new page automatically gets the right typography — only the per-component card/button styling needs manual conversion.

**Done, live in production:**
- Logo (real asset, not the old hand-drawn approximation) — header, sidebar, login, onboarding, favicon/app icon (`public/brand/`, `components/logo.tsx`)
- Landing page (`app/page.tsx` + `components/landing/*`)
- Dashboard shell: sidebar nav, establishment switcher (`app/dashboard/layout.tsx`, `components/dashboard/sidebar-nav.tsx`, `components/dashboard/establishment-switcher.tsx`)
- Vue d'ensemble / overview page: KPI cards, activity chart, activity feed, period selector (`app/dashboard/page.tsx` + `components/dashboard/{kpi-card,activity-chart,activity-feed,period-select}.tsx`)
- `/dashboard/customers` (list: pill filters/sort, rounded table card) + `/dashboard/customers/[id]` (detail: stat cards, history feed) + the Delete/Reverse-visit dialog trigger buttons — converted 2026-08-23 (later night), visually confirmed by Arnold on `localhost:3100` the same day.

**Not yet converted — still the older flat/hairline shadcn style:**
- `/dashboard/campaigns`
- `/dashboard/wallet` (card editor)
- `/dashboard/qr-nfc`
- `/dashboard/loyalty`
- `/dashboard/staff` (roster management)
- `/dashboard/scan`
- `/dashboard/audit`
- `/onboarding` wizard, `/join/[establishmentId]` public flow, `/card/[id]` public card, `/staff/[establishmentId]` counter PWA

None of this is broken — it's functionally complete, just visually inconsistent with the new pages until converted. Recommended approach for continuing: same pattern used for Vue d'ensemble — override card/button styling per-component via `className`/inline `style` (rounded-[Npx], soft `boxShadow`, brand hex colors), without touching the shared `components/ui/*` primitives, since those are used everywhere and a global change has much bigger blast radius than intended.

**Also stale**: `public/landing-dashboard-preview.png` (the screenshot embedded in the landing page) still shows the *old* dashboard style — needs re-capturing from a logged-in session once more of the dashboard is converted, since capturing it now would still show a half-converted product.

---

## What Works End-to-End Right Now

- [x] Auth (Supabase) → dashboard, scoped per establishment via RLS + `asEstablishmentUser`
- [x] Full loyalty loop: QR scan or manual phone entry → consent capture → visit/points events → live balance computed from event log
- [x] Public unauthenticated flows: `/join/[establishmentId]` (self-join) and `/card/[id]` (customer card view)
- [x] Dashboard v2: customer list with VIP/new/risk/active classification, search/filter, KPI cards, activity chart, campaign history with attributed revenue
- [x] Win-back automation: nightly Inngest detection → Twilio SMS → 14-day return attribution → revenue widget
- [x] GDPR: erasure (SET NULL on events, preserves aggregates), audit log, legal pages
- [x] Sentry + Dependabot live

---

## In Progress

- **Current task:** Frontend redesign pass, page by page (see "Frontend / Design Status" above). Landing + dashboard shell + Vue d'ensemble + Clients done, shipped, and visually confirmed by Arnold; 8 more dashboard/public pages still on the old style.
- **Blocked on:** nothing — this is unblocked, ongoing work. Stripe (Phase 6) and real Wallet issuance (Phase 4.5) remain untriggered/deferred as before.
- **Next logical step:** either keep converting dashboard pages one at a time (Campagnes is a reasonable next pick), or switch to Phase 8's remaining gaps (Supabase backup/restore test, first real pilot) — those need Arnold directly (dashboard access, business outreach), not more code. Both are legitimate next steps; no hard dependency between them.

---

## Deviations from the Original Plan

| Date | Original plan said | What was actually built | Reason |
|---|---|---|---|
| 2026-08 | Phase 3 = Dashboard v1, then move to Phase 4 | Phase 3 was substantially rebuilt as "Dashboard v2" (new shell, Campaigns/QR-NFC/Wallet/Loyalty pages, branding polish) — not itemized in plan-execution-claude-code.md | Unplanned scope growth; not wrong, but wasn't gated as its own phase |
| 2026-08 | Phase 4 = working Apple/Google Wallet pass issuance | Built only a visual card-appearance editor/preview; no .pkpass generation, no passkit-generator dependency | Deferred — matches the Fidoo Product Strategy doc's own advice to not overbuild Wallet/NFC before validating other things, but wasn't an explicit decision logged anywhere until now |
| 2026-08 | "Never advance phases before isolation tests pass" | Phase 8 pre-launch items (Sentry, Dependabot) shipped while Phase 6 (Stripe) has zero progress | Worth Arnold's attention — not necessarily wrong, but breaks the sequential-gate discipline the plan explicitly calls for |
| 2026-08-23 | Original Phase 4 = one monolithic "Wallet passes" phase, before Phase 6 | Replaced by phase-4-6-revision.md: split into Phase 4 (Staff PWA + wallet-lite, no real issuance) and Phase 4.5 (real Apple/Google Wallet issuance, deferred until a pilot needs it or Arnold greenlights it); Phase 6 (Stripe) resequenced to trigger on a real pilot converting to paid rather than a fixed phase order | Real `.pkpass` issuance is higher-effort/lower-urgency than getting the anti-fraud validation loop working; unblocks pilot onboarding sooner. See phase-4-6-revision.md for full reasoning. |
| 2026-08-23 | phase-4-6-revision.md said staff auth would be "PIN-based, not a full Supabase account per employee" | Implemented as a separate `StaffMember` roster table (own UUID, no Supabase auth.users row) rather than any EstablishmentUser variant — because `EstablishmentUser.id` is hard-FK'd to `auth.users`, so it can never NOT be a real Supabase account. The device running the Staff PWA still authenticates via the existing owner/Supabase session (RLS unchanged); the PIN only selects/attributes which `StaffMember` performed an action, it is not a second auth system. Matches the project's "Supabase Auth never homemade" rule. | This was flagged as an explicit open question before starting; resolved by design rather than by asking again, since the FK constraint made the answer unambiguous. |

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
| Wallet/QR/NFC pages have explicit "Bientôt disponible" stubs (download/print QR poster, NFC tag config) | Low | Intentional, not broken |
| `gh` CLI not installed; npm/npx need PATH refresh after Node install via winget | Low | Dev-environment annoyance only |
| No tested Supabase backup/restore | Medium | Runbook ready (`BACKUP_RESTORE_RUNBOOK.md`) — Arnold still needs to actually run it once in the Supabase dashboard |
| No real pilot establishment accounts yet | Medium | Onboarding is now scripted (`scripts/onboard-pilot.ts` + `PILOT_ONBOARDING.md`) — still needs Arnold to have a real establishment ready and the one-time service-role-key + email-delivery prerequisites set up |
| Vercel may look stale after push | Low | Build succeeds locally — check Deployments tab against the latest commit; likely propagation/cache lag |
| Staff PWA session doesn't persist between page loads | Low | Re-entering a PIN after every reload is intentional-for-now scope-tightening, not a bug, but may annoy staff mid-shift — revisit if it's a real friction point after the first pilot |
| 8 dashboard/public pages still in the old visual style | Low | Not broken, just inconsistent with the new "soft & tactile" pages — see Frontend / Design Status above for the exact list |
| `public/landing-dashboard-preview.png` shows the old dashboard style | Low | Stale screenshot embedded in the landing page — re-capture once more pages are converted |
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
