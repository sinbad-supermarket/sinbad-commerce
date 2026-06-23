import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminRole, type AdminRole } from "./roles";

export type CurrentAdmin = {
  id: string;
  userId: string;
  role: AdminRole;
  email: string | null;
};

type AdminUserRow = {
  id: string;
  user_id: string;
  role: string;
};

export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: adminUser, error } = await supabase
    .from("admin_users")
    .select("id,user_id,role")
    .eq("user_id", user.id)
    .maybeSingle<AdminUserRow>();

  if (error || !adminUser || !isAdminRole(adminUser.role)) {
    return null;
  }

  return {
    id: adminUser.id,
    userId: adminUser.user_id,
    role: adminUser.role,
    email: user.email ?? null,
  };
}
