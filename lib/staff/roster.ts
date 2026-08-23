import { asEstablishmentUser } from "@/lib/db/scoped";
import { hashPin, verifyPin, isValidPin } from "@/lib/staff/pin";

export type StaffMemberRow = {
  id: string;
  name: string;
  active: boolean;
};

/**
 * Staff roster for the owner-side management page. Scoped by RLS like any
 * other establishment data — the underlying Supabase session is still the
 * owner/device's, not the staff member's (see prisma/schema.prisma comment
 * on StaffMember for why staff don't get their own Supabase account).
 */
export async function listStaffMembers(userId: string): Promise<StaffMemberRow[]> {
  return asEstablishmentUser(userId, (tx) =>
    tx.staffMember.findMany({
      select: { id: true, name: true, active: true },
      orderBy: { name: "asc" },
    })
  );
}

/** Only active staff — shown on the PIN pad at the counter. */
export async function listActiveStaffMembers(
  userId: string
): Promise<{ id: string; name: string }[]> {
  return asEstablishmentUser(userId, (tx) =>
    tx.staffMember.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })
  );
}

export type CreateStaffMemberResult =
  | { status: "ok"; id: string }
  | { status: "invalid_pin" }
  | { status: "duplicate_name" };

export async function createStaffMember(
  userId: string,
  input: { name: string; pin: string }
): Promise<CreateStaffMemberResult> {
  if (!isValidPin(input.pin)) {
    return { status: "invalid_pin" };
  }

  return asEstablishmentUser(userId, async (tx) => {
    const establishmentUser = await tx.establishmentUser.findUniqueOrThrow({
      where: { id: userId },
    });

    const existing = await tx.staffMember.findUnique({
      where: {
        establishmentId_name: {
          establishmentId: establishmentUser.establishmentId,
          name: input.name,
        },
      },
    });
    if (existing) return { status: "duplicate_name" };

    const staff = await tx.staffMember.create({
      data: {
        establishmentId: establishmentUser.establishmentId,
        name: input.name,
        pinHash: hashPin(input.pin),
      },
    });
    return { status: "ok", id: staff.id };
  });
}

export async function setStaffMemberActive(
  userId: string,
  staffId: string,
  active: boolean
): Promise<void> {
  await asEstablishmentUser(userId, (tx) =>
    tx.staffMember.update({ where: { id: staffId }, data: { active } })
  );
}

/**
 * Verifies a PIN against one specific roster entry — the staff PWA already
 * knows *which* entry (the employee tapped their own name), this just
 * confirms they know the PIN for it. Deliberately does not accept a bare
 * PIN searched across the whole roster: PINs are 4-6 digits, short enough
 * that an unscoped search would turn "guess a PIN" into "guess anyone's
 * PIN," collapsing per-employee attribution.
 */
export async function verifyStaffMemberPin(
  userId: string,
  staffId: string,
  pin: string
): Promise<boolean> {
  return asEstablishmentUser(userId, async (tx) => {
    const staff = await tx.staffMember.findUnique({ where: { id: staffId } });
    if (!staff || !staff.active) return false;
    return verifyPin(pin, staff.pinHash);
  });
}
