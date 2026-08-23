"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { asEstablishmentUser } from "@/lib/db/scoped";
import { findCustomerById, findCustomerByPhone } from "@/lib/loyalty/customers";
import { getCustomerBalance } from "@/lib/loyalty/events";
import { hasMarketingConsent } from "@/lib/customers/consent";
import { verifyStaffMemberPin } from "@/lib/staff/roster";
import { recordStaffValidation, registerAndValidate } from "@/lib/staff/validate";

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

/**
 * Confirms the device's own logged-in establishment matches the :establishmentId
 * in the URL — a Staff PWA link for Establishment A must never let a device
 * signed in as Establishment B validate anything, even though staffId itself
 * is already establishment-scoped by RLS.
 */
async function requireMatchingEstablishment(establishmentId: string): Promise<string> {
  const userId = await requireUserId();
  const establishmentUser = await asEstablishmentUser(userId, (tx) =>
    tx.establishmentUser.findUniqueOrThrow({ where: { id: userId } })
  );
  if (establishmentUser.establishmentId !== establishmentId) {
    throw new Error("Establishment mismatch");
  }
  return userId;
}

export async function verifyPin(
  establishmentId: string,
  staffId: string,
  pin: string
): Promise<boolean> {
  const userId = await requireMatchingEstablishment(establishmentId);
  return verifyStaffMemberPin(userId, staffId, pin);
}

export type StaffCustomerLookupResult =
  | { status: "found"; customerId: string; name: string | null; balance: number; hasConsent: boolean }
  | { status: "not_found" }
  | { status: "invalid"; message: string };

export async function staffLookupCustomer(
  establishmentId: string,
  rawPhone: string
): Promise<StaffCustomerLookupResult> {
  const parsed = phoneSchema.safeParse(rawPhone);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0].message };
  }

  const userId = await requireMatchingEstablishment(establishmentId);
  const customer = await findCustomerByPhone(userId, parsed.data);
  if (!customer) return { status: "not_found" };

  const balance = await getCustomerBalance(userId, customer.id);
  return {
    status: "found",
    customerId: customer.id,
    name: customer.name,
    balance,
    hasConsent: hasMarketingConsent(customer),
  };
}

export type StaffValidateResult =
  | { status: "ok"; customerId: string; name: string | null; balance: number }
  | { status: "cooldown"; retryAfter: string }
  | { status: "invalid"; message: string };

export async function staffValidateVisit(
  establishmentId: string,
  staffId: string,
  customerId: string
): Promise<StaffValidateResult> {
  const userId = await requireMatchingEstablishment(establishmentId);
  const result = await recordStaffValidation(userId, staffId, customerId);

  if (result.status === "cooldown") {
    return { status: "cooldown", retryAfter: result.retryAfter.toISOString() };
  }

  const customer = await findCustomerById(userId, customerId);
  return { status: "ok", customerId, name: customer?.name ?? null, balance: result.balance };
}

const registrationSchema = z.object({
  phone: phoneSchema,
  name: z.string().trim().max(120).optional(),
  consent: z.boolean(),
});

export async function staffRegisterAndValidate(
  establishmentId: string,
  staffId: string,
  input: { phone: string; name?: string; consent: boolean }
): Promise<StaffValidateResult> {
  const parsed = registrationSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0].message };
  }

  const userId = await requireMatchingEstablishment(establishmentId);
  const result = await registerAndValidate(userId, staffId, parsed.data);
  return { status: "ok", customerId: result.customerId, name: parsed.data.name ?? null, balance: result.balance };
}
