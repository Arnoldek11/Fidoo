import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CustomerStatus } from "@/lib/loyalty/stats";

const STATUS: Record<CustomerStatus, { label: string; className: string }> = {
  risk: { label: "À réactiver", className: "bg-warning-bg text-warning" },
  vip: { label: "VIP", className: "bg-primary-tint text-primary" },
  new: { label: "Nouveau", className: "bg-success-bg text-success" },
  active: { label: "Actif", className: "bg-muted text-muted-foreground" },
};

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  const { label, className } = STATUS[status];
  return <Badge className={cn("border-transparent", className)}>{label}</Badge>;
}
