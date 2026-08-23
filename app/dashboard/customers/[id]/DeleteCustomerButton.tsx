"use client";

import { useTransition } from "react";
import { deleteCustomer } from "./actions";
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
import { Trash2 } from "lucide-react";

export function DeleteCustomerButton({ customerId }: { customerId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(() => {
      deleteCustomer(customerId);
    });
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="destructive" size="sm" className="rounded-full" />}>
        <Trash2 />
        Supprimer (RGPD)
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer ce client ?</DialogTitle>
          <DialogDescription>
            Ses données personnelles (téléphone, nom, consentement) seront
            définitivement effacées. Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" className="rounded-full" />}>Annuler</DialogClose>
          <Button variant="destructive" className="rounded-full" onClick={handleConfirm} disabled={isPending}>
            Supprimer définitivement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
