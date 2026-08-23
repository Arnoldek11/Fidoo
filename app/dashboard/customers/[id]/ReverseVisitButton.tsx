"use client";

import { useState, useTransition } from "react";
import { reverseVisit } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Undo2 } from "lucide-react";

export function ReverseVisitButton({ customerId }: { customerId: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleConfirm() {
    startTransition(async () => {
      const result = await reverseVisit(customerId);
      setMessage(
        result.status === "ok"
          ? `Corrigé — nouveau solde : ${result.balance} point${result.balance > 1 ? "s" : ""}.`
          : "Aucun point à annuler pour ce client."
      );
    });
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Undo2 />
        Corriger le dernier point
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Annuler le dernier point attribué ?</DialogTitle>
          <DialogDescription>
            Ajoute une correction dans l&apos;historique (l&apos;événement d&apos;origine
            n&apos;est jamais modifié ni supprimé) — à utiliser en cas d&apos;erreur au
            comptoir (mauvais client scanné, double validation…).
          </DialogDescription>
        </DialogHeader>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Fermer</DialogClose>
          <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
            Confirmer la correction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
