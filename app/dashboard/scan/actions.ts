"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { findCustomerById, findCustomerByPhone, registerCustomer } from "@/lib/loyalty/customers";
import { addVisit, getCustomerBalance } from "@/lib/loyalty/events";
import { hasMarketingConsent } from "@/lib/customers/consent";
import { redeemReward } from "@/lib/loyalty/redeem";
import { getProgram } from "@/lib/loyalty/program";

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
  | {
      status: "found";
      customerId: string;
      name: string | null;
      balance: number;
      goal: number;
      rewardLabel: string;
      hasConsent: boolean;
    }
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

  const [balance, program] = await Promise.all([
    getCustomerBalance(userId, customer.id),
    getProgram(userId),
  ]);
  return {
    status: "found",
    customerId: customer.id,
    name: customer.name,
    balance,
    goal: program.goal,
    rewardLabel: program.rewardLabel,
    hasConsent: hasMarketingConsent(customer),
  };
}

export type OwnerRedeemResult =
  | { status: "redeemed"; balance: number; rewardLabel: string }
  | { status: "insufficient"; balance: number; goal: number };

/** Owner-side redemption (no staff attribution) — solo owners use /dashboard/scan as their counter. */
export async function ownerRedeemReward(customerId: string): Promise<OwnerRedeemResult> {
  const userId = await requireUserId();
  const result = await redeemReward(userId, undefined, customerId);
  if (result.status === "insufficient") {
    return { status: "insufficient", balance: result.balance, goal: result.goal };
  }
  return { status: "redeemed", balance: result.balance, rewardLabel: result.rewardLabel };
}

export type RecordVisitResult = { customerId: string; name: string | null; balance: number };

export async function recordVisitForExistingCustomer(
  customerId: string
): Promise<RecordVisitResult> {
  const userId = await requireUserId();
  await addVisit(userId, customerId);
  const [customer, balance] = await Promise.all([
    findCustomerById(userId, customerId),
    getCustomerBalance(userId, customerId),
  ]);
  return { customerId, name: customer?.name ?? null, balance };
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
