import "server-only";

import { redirect } from "next/navigation";
import { getCurrentAdmin } from "./admin";

export async function requireAdmin() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login?error=required");
  }

  return admin;
}
