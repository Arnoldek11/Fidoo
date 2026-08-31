import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { asEstablishmentUser } from "@/lib/db/scoped";
import { DEFAULT_REDEMPTION_COST } from "@/lib/loyalty/events";
import { STAMP_ICON_NAMES } from "@/components/loyalty/stamp-icons";

export type ProgramSettings = {
  goal: number;
  rewardLabel: string;
  cardColor: string;
  textColor: string;
  stampIcon: string;
};

// What every card shows until the owner saves their own program — matches
// the column defaults in the loyalty_programs migration and the app's
// historical hardcoded look (coral card, coffee stamps, 10 visits).
export const DEFAULT_PROGRAM: ProgramSettings = {
  goal: DEFAULT_REDEMPTION_COST,
  rewardLabel: "récompense",
  cardColor: "#FF5A5F",
  textColor: "#FFFFFF",
  stampIcon: "coffee",
};

export const programInputSchema = z.object({
  goal: z.number().int().min(4, "Minimum 4 tampons").max(30, "Maximum 30 tampons"),
  rewardLabel: z.string().trim().min(1, "Décrivez la récompense").max(60, "60 caractères max"),
  cardColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Couleur invalide"),
  textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Couleur invalide"),
  stampIcon: z.string().refine((name) => STAMP_ICON_NAMES.includes(name), "Icône inconnue"),
});

type ProgramRow = {
  goal: number;
  rewardLabel: string;
  cardColor: string;
  textColor: string;
  stampIcon: string;
} | null;

function withDefaults(row: ProgramRow): ProgramSettings {
  if (!row) return DEFAULT_PROGRAM;
  return {
    goal: row.goal,
    rewardLabel: row.rewardLabel,
    cardColor: row.cardColor,
    textColor: row.textColor,
    stampIcon: row.stampIcon,
  };
}

/** Owner-side read (RLS-scoped). Defaults when the row doesn't exist yet. */
export async function getProgram(userId: string): Promise<ProgramSettings> {
  return asEstablishmentUser(userId, async (tx) => {
    const establishmentUser = await tx.establishmentUser.findUniqueOrThrow({
      where: { id: userId },
    });
    const row = await tx.loyaltyProgram.findUnique({
      where: { establishmentId: establishmentUser.establishmentId },
    });
    return withDefaults(row);
  });
}

/** Owner-side write (RLS-scoped). Input must already be Zod-validated at the action boundary. */
export async function upsertProgram(
  userId: string,
  input: ProgramSettings
): Promise<ProgramSettings> {
  return asEstablishmentUser(userId, async (tx) => {
    const establishmentUser = await tx.establishmentUser.findUniqueOrThrow({
      where: { id: userId },
    });
    const row = await tx.loyaltyProgram.upsert({
      where: { establishmentId: establishmentUser.establishmentId },
      update: input,
      create: { establishmentId: establishmentUser.establishmentId, ...input },
    });
    return withDefaults(row);
  });
}

/**
 * Public, unauthenticated read for the customer card and tap pages — same
 * deliberate skip of asEstablishmentUser/RLS as publicCard.ts: only ever
 * the one row for the id in the URL, appearance/threshold data only.
 */
export async function getPublicProgram(establishmentId: string): Promise<ProgramSettings> {
  const row = await prisma.loyaltyProgram.findUnique({
    where: { establishmentId },
  });
  return withDefaults(row);
}
