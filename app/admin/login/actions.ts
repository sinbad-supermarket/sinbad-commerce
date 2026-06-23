"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function loginAdmin(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/admin/login?error=missing");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect("/admin/login?error=invalid");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login?error=invalid");
  }

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminUser) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=not-admin");
  }

  redirect("/admin");
}
