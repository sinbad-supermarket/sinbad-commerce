import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { selectedVendorCookieName } from "@/lib/auth/require-vendor";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  redirect("/vendor");
}

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const cookieStore = await cookies();

  cookieStore.set(selectedVendorCookieName, "", {
    expires: new Date(0),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/vendor",
  });
  await supabase.auth.signOut();
  redirect("/vendor/login");
}
