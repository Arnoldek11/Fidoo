# Fidoo — Revised Phase 4 / 4.5 / 6 Plan

> **For:** Claude Code
> **Context:** Phases 0, 1, 2, 5, 7 are done. Phase 3 was rebuilt as "Dashboard v2" (unplanned but fine). Phase 4 (Wallet) is currently just a visual card-preview editor — no real issuance. Phase 6 (Stripe) has zero progress. This document replaces the original Phase 4 and Phase 6 sections of `plan-execution-claude-code.md`. Do not start work here until Arnold confirms this resequencing.
>
> **Why resequence:** The original plan treated "Wallet passes" as one monolithic phase and put it before Stripe. In practice, real Apple/Google Wallet *pass issuance* (`.pkpass` generation, push updates, NFC) is higher-effort and lower-urgency than getting the anti-fraud validation loop and a lightweight wallet-equivalent working. Stripe billing can wait as long as Fidoo is still in the discounted pilot phase (see original pricing plan — Starter/Growth pricing only matters once a pilot converts to paid). Splitting Wallet into "4" (Staff PWA + QR-based pass, no real issuance) and "4.5" (real Apple/Google Wallet issuance) unblocks pilot onboarding sooner and defers the highest-effort, most hardware/certificate-dependent work until it's proven necessary — consistent with the Fidoo Product Strategy doc's own phased roadmap (V1: QR + Wallet-lite + Staff; V1.5: NFC tags; V2: NFC Wallet contactless).

---

## Phase 4 (revised): Staff PWA + Wallet-lite

**Goal:** Give a restaurant employee a real way to validate visits/points at the counter, and give the customer a real (if QR-based, not NFC) pass — without yet building true `.pkpass` issuance.

### 4.1 — Fidoo Staff interface

- [ ] New route (e.g. `/staff/[establishmentId]`), separate auth context from the owner dashboard — staff login is lighter-weight (PIN-based, not full Supabase account per employee, unless you already have a simple staff-account model — confirm before building).
- [ ] Staff can scan/search a customer (by QR code, phone number, or existing `/card/[id]` link).
- [ ] Staff sees: customer name, current balance/tier, last visit date.
- [ ] Staff can validate one of: `+1 visit`, `+N points`, `redeem reward`.
- [ ] **Every validation action is attributed to a specific employee PIN** — add `staffPin` or `staffId` field to the `Event` model (nullable for backward compatibility with existing events).
- [ ] **Cooldown rule:** block a second credit to the same customer at the same establishment within a configurable window (default suggestion: 2 hours) — return a clear error, don't silently no-op.
- [ ] **Idempotency:** validation actions must be safe against double-submit (e.g. double-tap on a slow connection) — use an idempotency key or a server-side debounce keyed on (customerId, establishmentId, action, timestamp-bucket).
- [ ] Confirm the existing append-only event log already satisfies "immutable ledger" — if a correction is needed, it must be a new reversing event, never an edit/delete of a past row.

**Explicitly not required for this phase:** POS integration, anomaly/fraud-pattern detection beyond cooldown, multi-employee shift management.

### 4.2 — Wallet-lite pass (no real Apple/Google issuance yet)

- [ ] Keep the current visual card editor for restaurant-side branding (logo, color) — this already works.
- [ ] Customer-facing `/card/[id]` becomes the de facto "wallet pass": make sure it's installable as a home-screen shortcut (basic PWA manifest + icon) so it behaves like a pass without needing real Wallet integration.
- [ ] Confirm this page auto-updates (or has a manual refresh that's obviously fast) after a Staff validation, so the customer sees their new balance within seconds of a visit.

### Phase 4 Gate (must pass before Phase 4.5 or Phase 6)

- [ ] A staff member can validate a real visit for a real customer, attributed to their PIN, with cooldown/idempotency enforced.
- [ ] A customer can see their updated balance on their card page within ~5 seconds of a staff validation.
- [ ] Isolation test: staff at Establishment A cannot validate or view customers belonging to Establishment B.
- [ ] All new event rows carry a non-null `type` and (where applicable) `staffId`; no direct balance mutation outside the event log.

---

## Phase 4.5 (new, deferred): Real Apple/Google Wallet issuance

> Do not start this until Phase 4 gate has passed **and** at least one pilot has explicitly asked for a real Wallet pass, or Arnold decides to build it proactively for a specific pilot demo.

- [ ] Add `passkit-generator` (or equivalent) dependency; generate real `.pkpass` files for Apple Wallet.
- [ ] Add Google Wallet API integration for the Android equivalent.
- [ ] Push updates to installed passes when balance changes (Apple: pass update service + APNs; Google: Wallet API object patch).
- [ ] NFC: confirm scope stays at "Wallet-compatible NFC" (Apple Pay VAS / Google Smart Tap) rather than a proprietary terminal — per the Fidoo Product Strategy doc, this needs certified hardware/terminal partnerships and should not be attempted before a real POS/terminal partner is lined up.
- [ ] GDPR check: confirm what data lives in the pass payload itself vs. fetched live — passes are cached on-device and harder to update/erase than a webpage.

**Gate:** at least one real pilot has a working Wallet pass on their own phone, tested on both iOS and Android.

---

## Phase 6: Stripe billing (unchanged goal, resequenced trigger)

> Trigger condition: start this when Arnold has a specific establishment ready to convert from pilot to paid — not on a fixed calendar date. Until then, Fidoo can keep operating on manually-tracked pilot agreements.

- [ ] Add Stripe dependency, connect account/keys.
- [ ] Model `Establishment.plan` (Starter/Growth/Pro) and `Establishment.billingStatus` explicitly; enforce plan limits somewhere real (not just a display field) — decide what "enforcement" means for a single-tenant-owner-per-establishment app (e.g. feature-gating dashboard sections, not blocking data access).
- [ ] Stripe webhook route: handle `checkout.session.completed`, `invoice.payment_failed`, `customer.subscription.deleted` at minimum.
- [ ] Pilot → paid conversion flow: a simple "Upgrade" action in the dashboard that creates a Stripe Checkout session.
- [ ] Confirm what happens to data/access if payment fails or a subscription is canceled — don't hard-delete, follow the same non-destructive pattern used in Phase 7 (GDPR erasure).

**Gate:** one real establishment successfully completes a Stripe Checkout flow end-to-end in test mode, and a simulated `invoice.payment_failed` event is handled without crashing or silently ignoring it.

---

## Reconciliation note for CLAUDE.md / plan-execution-claude-code.md

Once Arnold confirms this document, ask Claude Code to:
1. Replace the original Phase 4 and Phase 6 sections in `plan-execution-claude-code.md` with references to this file (or inline the content).
2. Log this resequencing decision in `PROGRESS.md` under Deviations, since it changes phase order from the original plan.
3. Confirm the anti-fraud acceptance criteria above are captured somewhere durable (either this file or a dedicated `ANTI_FRAUD.md`) so they aren't lost if this file is later archived.
