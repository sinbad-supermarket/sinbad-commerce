import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getCurrentVendorMemberships,
  validDashboardMemberships,
  type CurrentVendorMembership,
} from "./vendor";

export const selectedVendorCookieName = "selected_vendor_id";

export async function requireVendorMemberships() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/vendor/login?error=required");
  }

  const memberships = validDashboardMemberships(await getCurrentVendorMemberships());

  if (memberships.length === 0) {
    redirect("/vendor/access-denied");
  }

  return memberships;
}

export async function requireSelectedVendor() {
  const memberships = await requireVendorMemberships();

  if (memberships.length === 1) {
    return {
      currentVendor: memberships[0],
      memberships,
    };
  }

  const cookieStore = await cookies();
  const selectedVendorId = cookieStore.get(selectedVendorCookieName)?.value;
  const currentVendor = memberships.find(
    (membership) => membership.vendor.id === selectedVendorId,
  );

  if (!currentVendor) {
    redirect("/vendor/select");
  }

  return {
    currentVendor,
    memberships,
  };
}

export function vendorStatusMessage(membership: CurrentVendorMembership) {
  if (membership.vendor.status === "pending") {
    return "This vendor account is pending. Dashboard access is available, but publishing remains disabled until admin approval.";
  }

  if (membership.vendor.status === "suspended") {
    return "This vendor account is suspended. Dashboard access is read-only until an admin reactivates the vendor.";
  }

  return null;
}
