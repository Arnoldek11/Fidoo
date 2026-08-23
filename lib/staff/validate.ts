import { asEstablishmentUser } from "@/lib/db/scoped";
import { addVisit, getCustomerBalance } from "@/lib/loyalty/events";
import { registerCustomer } from "@/lib/loyalty/customers";

// Also doubles as the idempotency guard: a double-tap or slow-connection
// double-submit lands well inside this window, so a customer can never be
// credited twice from one visit without a separate dedupe-key mechanism.
export const STAFF_VALIDATION_COOLDOWN_MS = 2 * 60 * 60 * 1000;

export type StaffValidationOk = { status: "ok"; customerId: string; balance: number };
export type StaffValidationResult = StaffValidationOk | { status: "cooldown"; retryAfter: Date };

/**
 * Staff-attributed version of addVisit: same immutable event insert, plus
 * (a) staffId attribution and (b) a cooldown check so the same customer
 * can't be credited twice in quick succession — by the same or a different
 * staff member, deliberately, since the point is to stop double-crediting
 * one visit, not to rate-limit one employee.
 */
export async function recordStaffValidation(
  userId: string,
  staffId: string,
  customerId: string
): Promise<StaffValidationResult> {
  const cooldownUntil = await asEstablishmentUser(userId, async (tx) => {
    const lastVisit = await tx.event.findFirst({
      where: { customerId, type: "visit" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    if (!lastVisit) return null;

    const retryAfter = new Date(lastVisit.createdAt.getTime() + STAFF_VALIDATION_COOLDOWN_MS);
    return retryAfter > new Date() ? retryAfter : null;
  });

  if (cooldownUntil) {
    return { status: "cooldown", retryAfter: cooldownUntil };
  }

  await addVisit(userId, customerId, staffId);
  const balance = await getCustomerBalance(userId, customerId);
  return { status: "ok", customerId, balance };
}

/**
 * New customer registered at the counter. No cooldown check needed — a
 * brand-new customer can't have a prior visit to collide with — but the
 * visit is still staff-attributed, same as recordStaffValidation.
 */
export async function registerAndValidate(
  userId: string,
  staffId: string,
  input: { phone: string; name?: string; consent: boolean }
): Promise<StaffValidationOk> {
  const customer = await registerCustomer(userId, input);
  await addVisit(userId, customer.id, staffId);
  const balance = await getCustomerBalance(userId, customer.id);
  return { status: "ok", customerId: customer.id, balance };
}
