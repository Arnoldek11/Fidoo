import { asEstablishmentUser } from "@/lib/db/scoped";

/**
 * Right to erasure: deletes the Customer row (removing phone/name/consent —
 * the actual PII) while their events survive with customer_id set to NULL
 * (the FK is ON DELETE SET NULL, not CASCADE — see the Event model), so
 * establishment-wide aggregates (visit counts, campaign attribution) don't
 * develop holes just because one customer was forgotten.
 *
 * Delete and audit-log write happen in the same transaction (via a single
 * asEstablishmentUser call) so they can't diverge — either both happen or
 * neither does.
 */
export async function eraseCustomer(userId: string, customerId: string) {
  return asEstablishmentUser(userId, async (tx) => {
    const establishmentUser = await tx.establishmentUser.findUniqueOrThrow({
      where: { id: userId },
    });

    await tx.customer.delete({ where: { id: customerId } });

    await tx.auditLog.create({
      data: {
        establishmentId: establishmentUser.establishmentId,
        actorUserId: userId,
        action: "erased_customer",
        targetType: "customer",
        targetId: customerId,
      },
    });
  });
}
