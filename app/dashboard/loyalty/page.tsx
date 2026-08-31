import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { asEstablishmentUser } from "@/lib/db/scoped";
import { getProgram } from "@/lib/loyalty/program";
import { ProgramEditor } from "@/components/dashboard/loyalty/program-editor";

export default async function LoyaltyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const establishmentUser = await asEstablishmentUser(user.id, (tx) =>
    tx.establishmentUser.findUnique({
      where: { id: user.id },
      include: { establishment: { select: { name: true } } },
    })
  );
  if (!establishmentUser) redirect("/login?error=no-establishment");

  const program = await getProgram(user.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-[#3A322B]">Fidélité</h1>
        <p className="mt-1 font-medium text-[#8A7D6C]">
          Votre carte, vos couleurs — qu&apos;est-ce que vous offrez à vos clients fidèles ?
        </p>
      </div>

      <ProgramEditor initial={program} establishmentName={establishmentUser.establishment.name} />
    </div>
  );
}
