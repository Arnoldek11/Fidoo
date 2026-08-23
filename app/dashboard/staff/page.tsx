import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { asEstablishmentUser } from "@/lib/db/scoped";
import { listStaffMembers } from "@/lib/staff/roster";
import { StaffRoster } from "./StaffRoster";

export default async function StaffPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const establishmentUser = await asEstablishmentUser(user.id, (tx) =>
    tx.establishmentUser.findUnique({ where: { id: user.id } })
  );
  if (!establishmentUser) redirect("/login?error=no-establishment");

  const staff = await listStaffMembers(user.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Équipe</h1>
        <p className="mt-1 text-muted-foreground">
          Chaque employé a son propre code PIN pour valider les visites au comptoir (
          <a href={`/staff/${establishmentUser.establishmentId}`} className="underline">
            ouvrir le comptoir
          </a>
          ).
        </p>
      </div>

      <StaffRoster initialStaff={staff} />
    </div>
  );
}
