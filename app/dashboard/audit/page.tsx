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
        <h1 className="text-xl font-semibold">Journal d&apos;accès</h1>
        <p className="text-sm text-muted-foreground">
          Qui a consulté ou supprimé des données client, et quand.
        </p>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Cible</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{entry.createdAt.toLocaleString("fr-BE")}</TableCell>
                <TableCell>
                  <Badge
                    variant={entry.action === "erased_customer" ? "destructive" : "secondary"}
                  >
                    {ACTION_LABELS[entry.action] ?? entry.action}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {entry.targetId}
                </TableCell>
              </TableRow>
            ))}
            {entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
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
