"use client";

import { useTransition } from "react";
import { deleteCustomer } from "./actions";

export function DeleteCustomerButton({ customerId }: { customerId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (
      !window.confirm(
        "Supprimer définitivement ce client ? Ses données personnelles (téléphone, nom, consentement) seront effacées. Cette action est irréversible."
      )
    ) {
      return;
    }
    startTransition(() => {
      deleteCustomer(customerId);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
    >
      Supprimer (RGPD)
    </button>
  );
}
