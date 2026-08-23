"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function login(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/login?error=invalid");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // A network-level failure (e.g. the 8s fetch timeout in
    // lib/supabase/fetch-with-timeout.ts) surfaces as AuthRetryableFetchError,
    // not a rejected password — don't tell the user their credentials are
    // wrong when the real problem is connectivity.
    redirect(error.name === "AuthRetryableFetchError" ? "/login?error=network" : "/login?error=credentials");
  }

  redirect("/dashboard");
}
