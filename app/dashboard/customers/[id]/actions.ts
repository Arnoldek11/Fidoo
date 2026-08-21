"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { eraseCustomer } from "@/lib/customers/erasure";

export async function deleteCustomer(customerId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await eraseCustomer(user.id, customerId);
  redirect("/dashboard/customers");
}
