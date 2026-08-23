"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { eraseCustomer } from "@/lib/customers/erasure";
import { reverseLastVisit, type ReverseLastVisitResult } from "@/lib/loyalty/reversal";

export async function deleteCustomer(customerId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await eraseCustomer(user.id, customerId);
  redirect("/dashboard/customers");
}

export async function reverseVisit(customerId: string): Promise<ReverseLastVisitResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const result = await reverseLastVisit(user.id, customerId);
  revalidatePath(`/dashboard/customers/${customerId}`);
  return result;
}
