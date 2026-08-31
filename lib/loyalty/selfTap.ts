import { prisma } from "@/lib/prisma";
import { computeBalance, POINTS_PER_VISIT } from "@/lib/loyalty/events";
import { DEFAULT_PROGRAM, type ProgramSettings } from "@/lib/loyalty/program";
import { maybeAttributeReturn } from "@/lib/winback/attribution";
import { STAFF_VALIDATION_COOLDOWN_MS } from "@/lib/staff/validate";
import type { ScopedTx } from "@/lib/db/scoped";

// Same window as the staff console, on purpose: one visit = one stamp,
// whichever channel recorded it. A customer stamped at the counter can't
// immediately re-stamp on the tap pod, and vice versa.
export const SELF_TAP_COOLDOWN_MS = STAFF_VALIDATION_COOLDOWN_MS;

export type SelfTapCard = ProgramSettings & {
  customerId: string;
  name: string | null;
  establishmentName: string;
  balance: number;
};

export type SelfTapResult =
  | { status: "stamped"; card: SelfTapCard }
  | { status: "cooldown"; retryAfter: Date; card: SelfTapCard }
  | { status: "not_found" };

async function buildCard(
  tx: ScopedTx,
  customer: { id: string; name: string | null; establishmentId: string },
  establishmentName: string
): Promise<SelfTapCard> {
  const [events, programRow] = await Promise.all([
    tx.event.findMany({
      where: {
        customerId: customer.id,
        type: { in: ["points_added", "reward_redeemed", "points_reversed"] },
      },
      select: { type: true, metadata: true },
    }),
    tx.loyaltyProgram.findUnique({ where: { establishmentId: customer.establishmentId } }),
  ]);

  const program: ProgramSettings = programRow
    ? {
        goal: programRow.goal,
        rewardLabel: programRow.rewardLabel,
        cardColor: programRow.cardColor,
        textColor: programRow.textColor,
        stampIcon: programRow.stampIcon,
      }
    : DEFAULT_PROGRAM;

  return {
    ...program,
    customerId: customer.id,
    name: customer.name,
    establishmentName,
    balance: computeBalance(events),
  };
}

/**
 * Records a customer-initiated tap (NFC pod / QR at the till) as the same
 * pair of immutable events a staff validation writes — `visit` +
 * `points_added` — just unattributed (staffId null) and tagged
 * `metadata.source = "self_tap"` so the journal always shows which channel
 * credited a stamp and an owner can reverse selectively.
 *
 * Public, unauthenticated WRITE — there is no logged-in user, so this
 * deliberately skips asEstablishmentUser/RLS, same trust model as
 * getCustomerCard in publicCard.ts: the customer id is an unguessable
 * bearer UUID held by the customer's own device, and the write is narrowly
 * scoped to that one verified (customer, establishment) pair. The cooldown
 * (shared with staff validation) is what stops replay from crediting more
 * than one stamp per visit window.
 */
export async function recordSelfTap(
  establishmentId: string,
  customerId: string
): Promise<SelfTapResult> {
  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({
      where: { id: customerId },
      include: { establishment: { select: { id: true, name: true } } },
    });
    if (!customer || customer.establishmentId !== establishmentId) {
      return { status: "not_found" } as const;
    }

    const lastVisit = await tx.event.findFirst({
      where: { customerId, type: "visit" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    if (lastVisit) {
      const retryAfter = new Date(lastVisit.createdAt.getTime() + SELF_TAP_COOLDOWN_MS);
      if (retryAfter > new Date()) {
        return {
          status: "cooldown" as const,
          retryAfter,
          card: await buildCard(tx, customer, customer.establishment.name),
        };
      }
    }

    const visit = await tx.event.create({
      data: {
        establishmentId,
        customerId,
        type: "visit",
        metadata: { source: "self_tap" },
      },
    });
    await tx.event.create({
      data: {
        establishmentId,
        customerId,
        type: "points_added",
        metadata: { source: "self_tap", points: POINTS_PER_VISIT },
      },
    });

    await maybeAttributeReturn(tx, establishmentId, customerId, visit.createdAt);

    return {
      status: "stamped" as const,
      card: await buildCard(tx, customer, customer.establishment.name),
    };
  });
}

/**
 * First tap from a device we don't recognize: find-or-create the customer
 * by (establishment, phone), then run the normal tap. An existing customer
 * re-identifying on a new phone lands on their real card (and hits the
 * cooldown if their visit was already counted) instead of a duplicate.
 *
 * Consent semantics match registerCustomer: holding a stamp card never
 * requires marketing consent — consentGivenAt/consentChannel are only set
 * when the box was actually ticked.
 */
export async function selfJoinAndTap(
  establishmentId: string,
  input: { phone: string; name?: string; consent: boolean }
): Promise<SelfTapResult> {
  const establishment = await prisma.establishment.findUnique({
    where: { id: establishmentId },
    select: { id: true },
  });
  if (!establishment) return { status: "not_found" };

  // update: {} — an existing customer's name/consent are never overwritten
  // by a later tap-signup; the upsert only closes the create/create race.
  const customer = await prisma.customer.upsert({
    where: { establishmentId_phone: { establishmentId, phone: input.phone } },
    update: {},
    create: {
      establishmentId,
      phone: input.phone,
      name: input.name,
      consentGivenAt: input.consent ? new Date() : null,
      consentChannel: input.consent ? "self_tap" : null,
    },
  });

  return recordSelfTap(establishmentId, customer.id);
}
