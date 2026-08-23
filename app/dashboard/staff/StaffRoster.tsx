"use client";

import { useState, useTransition, type FormEvent } from "react";
import { addStaffMember, toggleStaffMemberActive } from "./actions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserPlus } from "lucide-react";
import type { StaffMemberRow } from "@/lib/staff/roster";

export function StaffRoster({ initialStaff }: { initialStaff: StaffMemberRow[] }) {
  const [staff, setStaff] = useState(initialStaff);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addStaffMember({ name, pin });
      if (result.status === "invalid_pin") {
        setError("Le code PIN doit contenir entre 4 et 6 chiffres.");
        return;
      }
      if (result.status === "duplicate_name") {
        setError("Un employé porte déjà ce nom.");
        return;
      }
      setStaff((prev) => [...prev, { id: result.id, name, active: true }].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
      setPin("");
    });
  }

  function handleToggle(id: string, active: boolean) {
    startTransition(async () => {
      await toggleStaffMemberActive(id, active);
      setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, active } : s)));
    });
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card
        className="rounded-[22px] border-none bg-white [--card-spacing:--spacing(6)]"
        style={{ boxShadow: "0 14px 28px -10px rgba(74,64,56,0.1)" }}
      >
        <CardContent className="space-y-4 pt-6">
          <p className="text-[13px] font-semibold text-[#8A7D6C]">
            {staff.length === 0 ? "Aucun employé" : `${staff.length} employé${staff.length > 1 ? "s" : ""}`}
          </p>
          <div className="space-y-2">
            {staff.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-2xl bg-[#F6ECDD] px-3.5 py-2.5"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-[#3A322B]">
                  {s.name}
                  {!s.active && <Badge variant="secondary">Désactivé</Badge>}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  disabled={isPending}
                  onClick={() => handleToggle(s.id, !s.active)}
                >
                  {s.active ? "Désactiver" : "Réactiver"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card
        className="rounded-[22px] border-none bg-white [--card-spacing:--spacing(6)]"
        style={{ boxShadow: "0 14px 28px -10px rgba(74,64,56,0.1)" }}
      >
        <CardContent className="space-y-4 pt-6">
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-[#8A7D6C]">
            <UserPlus className="size-4" />
            Ajouter un employé
          </p>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="staff-name">Nom</Label>
              <Input id="staff-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="staff-pin">Code PIN (4 à 6 chiffres)</Label>
              <Input
                id="staff-pin"
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full rounded-full" disabled={isPending}>
              Ajouter
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
