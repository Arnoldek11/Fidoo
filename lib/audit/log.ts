import { asEstablishmentUser } from "@/lib/db/scoped";

export type AuditAction = "viewed_customer" | "erased_customer";

export async function logAudit(
  userId: string,
  action: AuditAction,
  targetType: string,
  targetId: string
) {
  return asEstablishmentUser(userId, async (tx) => {
    const establishmentUser = await tx.establishmentUser.findUniqueOrThrow({
      where: { id: userId },
    });

    return tx.auditLog.create({
      data: {
        establishmentId: establishmentUser.establishmentId,
        actorUserId: userId,
        action,
        targetType,
        targetId,
      },
    });
  });
}

export async function getAuditLog(userId: string) {
  return asEstablishmentUser(userId, (tx) =>
    tx.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 })
  );
}
