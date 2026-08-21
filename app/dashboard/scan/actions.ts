"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { findCustomerByPhone, registerCustomer } from "@/lib/loyalty/customers";
import { addVisit, getCustomerBalance } from "@/lib/loyalty/events";
import { hasMarketingConsent } from "@/lib/customers/consent";

const phoneSchema = z
  .string()
  .trim()
  .min(6, "Numéro trop court")
  .regex(/^[0-9+\s()-]+$/, "Numéro invalide");

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export type CustomerLookupResult =
  | { status: "found"; customerId: string; name: string | null; balance: number; hasConsent: boolean }
  | { status: "not_found" }
  | { status: "invalid"; message: string };

export async function lookupCustomer(rawPhone: string): Promise<CustomerLookupResult> {
  const parsed = phoneSchema.safeParse(rawPhone);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0].message };
  }

  const userId = await requireUserId();
  const customer = await findCustomerByPhone(userId, parsed.data);

  if (!customer) {
    return { status: "not_found" };
  }

  const balance = await getCustomerBalance(userId, customer.id);
  return {
    status: "found",
    customerId: customer.id,
    name: customer.name,
    balance,
    hasConsent: hasMarketingConsent(customer),
  };
}

export type RecordVisitResult = { customerId: string; name: string | null; balance: number };

export async function recordVisitForExistingCustomer(
  customerId: string
): Promise<RecordVisitResult> {
  const userId = await requireUserId();
  await addVisit(userId, customerId);
  const balance = await getCustomerBalance(userId, customerId);
  return { customerId, name: null, balance };
}

const registrationSchema = z.object({
  phone: phoneSchema,
  name: z.string().trim().max(120).optional(),
  consent: z.boolean(),
});

export async function registerCustomerAndRecordVisit(input: {
  phone: string;
  name?: string;
  consent: boolean;
}): Promise<RecordVisitResult | { status: "invalid"; message: string }> {
  const parsed = registrationSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0].message };
  }

  const userId = await requireUserId();
  const customer = await registerCustomer(userId, parsed.data);
  await addVisit(userId, customer.id);
  const balance = await getCustomerBalance(userId, customer.id);

  return { customerId: customer.id, name: customer.name, balance };
}
