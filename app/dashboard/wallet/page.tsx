import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { asEstablishmentUser } from "@/lib/db/scoped";
import { WalletEditor } from "@/components/dashboard/wallet/wallet-editor";

export default async function WalletPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const establishmentUser = await asEstablishmentUser(user.id, (tx) =>
    tx.establishmentUser.findUnique({
      where: { id: user.id },
      include: { establishment: true },
    })
  );
  if (!establishmentUser) redirect("/login?error=no-establishment");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-[#3A322B]">Cartes Wallet</h1>
        <p className="mt-1 font-medium text-[#8A7D6C]">À quoi ressemble leur carte ?</p>
      </div>
      <WalletEditor establishmentName={establishmentUser.establishment.name} />
    </div>
  );
}
