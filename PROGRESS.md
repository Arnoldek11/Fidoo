# Fidoo — Progress Log

> **Purpose:** This file is the single source of truth for project status. Claude Code updates it after every phase gate passes. Arnold pastes its contents into claude.ai (chat with strategic Claude) whenever he needs a status-informed conversation, review, or planning session.
>
> **Rule for Claude Code:** Update this file automatically right after a phase's validation gate passes — don't wait to be asked. Keep entries factual and concise. Never delete history; append.

---

## Snapshot (update this block every time)

- **Last updated:** 2026-08-23
- **Current phase:** Phase 4 (revised: Staff PWA + wallet-lite) implemented, not yet gate-verified with a real device/pilot; Phase 4.5 (real Apple/Google Wallet issuance) and Phase 6 (Stripe) deferred by design, see Deviations
- **Phase status:** In progress — see tracker
- **Overall completion:** ~6 / 9 phases complete (0–8 plus the new 4.5, per plan-execution-claude-code.md + phase-4-6-revision.md)
- **Stack confirmed:** Next.js 16 (App Router) + TypeScript · Prisma 7 · Postgres/Supabase (Auth + RLS) · Tailwind + shadcn/ui · Inngest · Twilio · Sentry — **Stripe and passkit-generator not yet added**
- **Brand name:** Fidoo (confirmed — check trademark status below)
- **Last commits (as of last push):** 5178d08 (customer classification), 55f36b2 (onboarding wizard + public self-join), d48416c (Dashboard v2 rebuild) — all pushed to origin/main. Phase 4 (revised) work below is implemented and tested locally, **not yet committed/pushed** — see In Progress.

---

## Phase Tracker

| Phase | Name | Status | Gate Passed? | Notes |
|---|---|---|---|---|
| 0 | Skeleton | ✅ Done | ✅ | Deployed to Vercel |
| 1 | Multi-tenant + RLS | ✅ Done | ✅ | RLS enforced, isolation test exists |
| 2 | Customer ID + points loop | ✅ Done | ✅ | customers/events tables, append-only journal, QR scan flow |
| 3 | Dashboard v1 | ✅ Done | ✅ | Superseded in practice by "Dashboard v2" (unplanned rebuild, see Deviations) |
| 4 | Staff PWA + wallet-lite (revised, replaces original "Wallet passes") | 🟡 Built, ungated | ☐ | See phase-4-6-revision.md. Staff roster (`/dashboard/staff`), PIN-based counter console (`/staff/[establishmentId]`), cooldown + staff attribution on events, owner-only reversal, per-customer installable manifest on `/card/[id]`. Gate (real device, real pilot) not yet run. |
| 4.5 | Real Apple/Google Wallet issuance (new, deferred) | ⚠️ Deferred | ☐ | Explicitly not started — waits for Phase 4 gate + a pilot request or Arnold's go-ahead, per phase-4-6-revision.md |
| 5 | Win-back + attribution | ✅ Done | ✅ | Inngest nightly job, Twilio SMS, attributed_return logic, revenue widget |
| 6 | Stripe billing | ❌ Not started (resequenced) | ☐ | Trigger is now "a specific establishment ready to convert from pilot to paid," not a fixed phase order — see phase-4-6-revision.md |
| 7 | GDPR | ✅ Done | ✅ | Right-to-erasure, audit log, legal pages |
| 8 | Pre-launch | 🟡 Partial | ☐ | Sentry + Dependabot wired; backup-restore test and real pilot accounts NOT evidenced |

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

- **Current task:** Phase 4 (revised) — Staff PWA + wallet-lite — implemented and locally verified (69/69 tests, tsc clean, prod build compiles all 24 routes). **Not yet committed or pushed to origin/main.**
- **Blocked on:** real-device verification of the Phase 4 gate (staff validates a real visit, cooldown/isolation hold up outside a test DB); Stripe still not started (Phase 6); real Wallet issuance still not started (Phase 4.5)
- **Next logical step:** commit/push this Phase 4 work (ask Arnold first — nothing auto-commits), then run the Phase 4 gate checklist with a real staff member + device; after that, decide Wallet 4.5 vs. Stripe 6 priority per the resequencing doc's trigger conditions

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
| No evidence of tested Supabase backup/restore or real pilot establishment accounts | Medium | Phase 8 checklist gap |
| Vercel may look stale after push | Low | Build succeeds locally — check Deployments tab against the latest commit; likely propagation/cache lag |
| Phase 4 (Staff PWA + wallet-lite) implemented but not committed/pushed | Medium | Only exists on this machine's working tree as of 2026-08-23; ask Arnold before committing |
| Phase 4 gate not run against a real device/pilot | Medium | All verification so far is automated tests + local build; "staff validates a real visit, sees it within 5s on the card page" has not been physically tested |
| Staff PWA session doesn't persist between page loads | Low | Re-entering a PIN after every reload is intentional-for-now scope-tightening, not a bug, but may annoy staff mid-shift — revisit if it's a real friction point after the first pilot |

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
