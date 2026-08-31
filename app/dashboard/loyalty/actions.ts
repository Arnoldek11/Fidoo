"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { programInputSchema, upsertProgram, type ProgramSettings } from "@/lib/loyalty/program";

export type SaveProgramResult =
  | { status: "ok"; program: ProgramSettings }
  | { status: "invalid"; message: string };

export async function saveProgram(input: ProgramSettings): Promise<SaveProgramResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const parsed = programInputSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "invalid", message: parsed.error.issues[0].message };
  }

  const program = await upsertProgram(user.id, parsed.data);
  revalidatePath("/dashboard/loyalty");
  return { status: "ok", program };
}
