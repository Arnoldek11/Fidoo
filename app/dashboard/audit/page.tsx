import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuditLog } from "@/lib/audit/log";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const ACTION_LABELS: Record<string, string> = {
  viewed_customer: "Consultation",
  erased_customer: "Suppression",
};

export default async function AuditLogPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const entries = await getAuditLog(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-bold text-[#3A322B]">Journal d&apos;accès</h1>
        <p className="text-sm font-medium text-[#8A7D6C]">
          Qui a consulté ou supprimé des données client, et quand.
        </p>
      </div>

      <div
        className="overflow-hidden rounded-[24px] bg-white"
        style={{ boxShadow: "0 14px 28px -10px rgba(74,64,56,0.1)" }}
      >
        <Table>
          <TableHeader>
            <TableRow className="border-b border-[#F6ECDD] hover:bg-transparent">
              <TableHead className="h-11 px-4 text-[11px] font-semibold tracking-wide text-[#B0A290] uppercase">Date</TableHead>
              <TableHead className="text-[11px] font-semibold tracking-wide text-[#B0A290] uppercase">Action</TableHead>
              <TableHead className="px-4 text-[11px] font-semibold tracking-wide text-[#B0A290] uppercase">Cible</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow
                key={entry.id}
                className="border-b border-[#F6ECDD] transition-colors last:border-0 hover:bg-[#FFF8F0]"
              >
                <TableCell className="px-4 py-3.5 font-medium text-[#5B4F44]">
                  {entry.createdAt.toLocaleString("fr-BE")}
                </TableCell>
                <TableCell className="py-3.5">
                  <Badge
                    variant={entry.action === "erased_customer" ? "destructive" : "secondary"}
                  >
                    {ACTION_LABELS[entry.action] ?? entry.action}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3.5 font-mono text-xs text-[#B0A290]">
                  {entry.targetId}
                </TableCell>
              </TableRow>
            ))}
            {entries.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3} className="py-10 text-center font-medium text-[#8A7D6C]">
                  Aucune entrée pour le moment.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
