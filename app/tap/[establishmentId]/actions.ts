"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { recordSelfTap, selfJoinAndTap, type SelfTapResult } from "@/lib/loyalty/selfTap";

const uuidSchema = z.string().uuid();

const registrationSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(6, "Numéro trop court")
    .regex(/^[0-9+\s()-]+$/, "Numéro invalide"),
  name: z.string().trim().max(120).optional(),
  consent: z.boolean(),
});

// One cookie per establishment (a phone can hold cards for several places).
// httpOnly: the customer id is a bearer credential for this card — client
// JS never needs to read it, the tap action resolves it server-side.
const COOKIE_MAX_AGE_S = 60 * 60 * 24 * 400; // ~13 months, browsers' practical cap

function cardCookieName(establishmentId: string): string {
  return `fidoo_card_${establishmentId}`;
}

export type TapActionResult =
  | {
      status: "stamped" | "cooldown";
      customerId: string;
      name: string | null;
      establishmentName: string;
      balance: number;
      goal: number;
      rewardLabel: string;
      cardColor: string;
      textColor: string;
      stampIcon: string;
      retryAfter?: string;
    }
  | { status: "unknown" }
  | { status: "invalid"; message: string };

function toActionResult(result: SelfTapResult): TapActionResult {
  if (result.status === "not_found") return { status: "unknown" };
  return {
    status: result.status,
    ...result.card,
    retryAfter: result.status === "cooldown" ? result.retryAfter.toISOString() : undefined,
  };
}

/**
 * The instant path: the device already holds this establishment's card
 * cookie. The customer id deliberately comes from the cookie, never from
 * the client payload — a tap can only ever credit the card this browser
 * actually holds.
 */
export async function tapAsKnownCustomer(rawEstablishmentId: string): Promise<TapActionResult> {
  const establishmentId = uuidSchema.safeParse(rawEstablishmentId);
  if (!establishmentId.success) return { status: "invalid", message: "Lien invalide" };

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(cardCookieName(establishmentId.data))?.value;
  const customerId = uuidSchema.safeParse(cookieValue);
  if (!customerId.success) return { status: "unknown" };

  const result = await recordSelfTap(establishmentId.data, customerId.data);
  if (result.status === "not_found") {
    // Stale cookie (customer erased, or wrong establishment) — forget it so
    // the next tap goes through the signup path instead of failing forever.
    cookieStore.delete(cardCookieName(establishmentId.data));
    return { status: "unknown" };
  }

  return toActionResult(result);
}

/**
 * First tap on this device: register (or re-identify by phone), remember
 * the card on the device, and stamp.
 */
export async function joinAndTap(
  rawEstablishmentId: string,
  input: { phone: string; name?: string; consent: boolean }
): Promise<TapActionResult> {
  const establishmentId = uuidSchema.safeParse(rawEstablishmentId);
  if (!establishmentId.success) return { status: "invalid", message: "Lien invalide" };

  const parsed = registrationSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0].message };
  }

  const result = await selfJoinAndTap(establishmentId.data, parsed.data);
  if (result.status === "not_found") {
    return { status: "invalid", message: "Établissement introuvable" };
  }

  const cookieStore = await cookies();
  cookieStore.set(cardCookieName(establishmentId.data), result.card.customerId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE_S,
    path: "/",
  });

  return toActionResult(result);
}
