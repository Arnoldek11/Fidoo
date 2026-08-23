import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { asEstablishmentUser } from "@/lib/db/scoped";
import { listActiveStaffMembers } from "@/lib/staff/roster";
import { StaffConsole } from "./StaffConsole";

export default async function StaffPwaPage({
  params,
}: {
  params: Promise<{ establishmentId: string }>;
}) {
  const { establishmentId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/staff/${establishmentId}`);

  const establishmentUser = await asEstablishmentUser(user.id, (tx) =>
    tx.establishmentUser.findUnique({
      where: { id: user.id },
      include: { establishment: true },
    })
  );
  // A device signed in as one establishment must never operate the Staff
  // PWA for a different one, even though every downstream query is also
  // RLS-scoped — this catches the mismatch before any staff PIN is shown.
  if (!establishmentUser || establishmentUser.establishmentId !== establishmentId) {
    notFound();
  }

  const staff = await listActiveStaffMembers(user.id);

  return (
    <StaffConsole
      establishmentId={establishmentId}
      establishmentName={establishmentUser.establishment.name}
      staff={staff}
    />
  );
}
