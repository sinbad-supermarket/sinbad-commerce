"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  requireVendorMemberships,
  selectedVendorCookieName,
} from "@/lib/auth/require-vendor";

export async function selectVendorAccount(formData: FormData) {
  const vendorId = String(formData.get("vendor_id") ?? "");
  const memberships = await requireVendorMemberships();
  const membership = memberships.find((item) => item.vendor.id === vendorId);

  if (!membership) {
    redirect("/vendor/select?error=invalid");
  }

  const cookieStore = await cookies();
  cookieStore.set(selectedVendorCookieName, membership.vendor.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/vendor",
  });

  redirect("/vendor");
}
