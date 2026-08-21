import { asEstablishmentUser } from "@/lib/db/scoped";

export async function findCustomerByPhone(userId: string, phone: string) {
  return asEstablishmentUser(userId, async (tx) => {
    const establishmentUser = await tx.establishmentUser.findUniqueOrThrow({
      where: { id: userId },
    });

    return tx.customer.findUnique({
      where: {
        establishmentId_phone: {
          establishmentId: establishmentUser.establishmentId,
          phone,
        },
      },
    });
  });
}

export async function registerCustomer(
  userId: string,
  input: { phone: string; name?: string; consent: boolean }
) {
  return asEstablishmentUser(userId, async (tx) => {
    const establishmentUser = await tx.establishmentUser.findUniqueOrThrow({
      where: { id: userId },
    });

    return tx.customer.create({
      data: {
        establishmentId: establishmentUser.establishmentId,
        phone: input.phone,
        name: input.name,
        consentGivenAt: input.consent ? new Date() : null,
        consentChannel: input.consent ? "scan_form" : null,
      },
    });
  });
}
