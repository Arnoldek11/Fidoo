"use server";

import { createClient } from "@/lib/supabase/server";
import {
  createStaffMember,
  setStaffMemberActive,
  type CreateStaffMemberResult,
} from "@/lib/staff/roster";

async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export async function addStaffMember(input: {
  name: string;
  pin: string;
}): Promise<CreateStaffMemberResult> {
  const userId = await requireUserId();
  return createStaffMember(userId, input);
}

export async function toggleStaffMemberActive(staffId: string, active: boolean): Promise<void> {
  const userId = await requireUserId();
  await setStaffMemberActive(userId, staffId, active);
}
