"use server";

import { redirect } from "next/navigation";
import { getCurrentVendorMemberships, validDashboardMemberships } from "@/lib/auth/vendor";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function loginVendor(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/vendor/login?error=missing");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect("/vendor/login?error=invalid");
  }

  const memberships = validDashboardMemberships(await getCurrentVendorMemberships());

  if (memberships.length === 0) {
    redirect("/vendor/access-denied");
  }

  if (memberships.length > 1) {
    redirect("/vendor/select");
  }

  redirect("/vendor");
}
