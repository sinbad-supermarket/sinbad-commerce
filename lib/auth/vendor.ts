import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isVendorRole, type VendorRole } from "./vendor-roles";

export type VendorStatus = "pending" | "active" | "suspended" | "archived";

export type CurrentVendorMembership = {
  membershipId: string;
  role: VendorRole;
  vendor: {
    id: string;
    nameEn: string;
    nameAr: string | null;
    slug: string;
    status: VendorStatus;
    isPublic: boolean;
  };
};

type VendorMembershipRow = {
  id: string;
  role: string;
  vendors:
    | {
        id: string;
        name_en: string;
        name_ar: string | null;
        slug: string;
        status: string;
        is_public: boolean;
      }
    | {
        id: string;
        name_en: string;
        name_ar: string | null;
        slug: string;
        status: string;
        is_public: boolean;
      }[]
    | null;
};

function firstVendor(row: VendorMembershipRow) {
  return Array.isArray(row.vendors) ? row.vendors[0] : row.vendors;
}

export async function getCurrentVendorMemberships() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("vendor_users")
    .select(
      "id,role,vendors(id,name_en,name_ar,slug,status,is_public)",
    )
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as VendorMembershipRow[])
    .map((row) => {
      const vendor = firstVendor(row);

      if (!vendor || !isVendorRole(row.role)) {
        return null;
      }

      return {
        membershipId: row.id,
        role: row.role,
        vendor: {
          id: vendor.id,
          nameEn: vendor.name_en,
          nameAr: vendor.name_ar,
          slug: vendor.slug,
          status: vendor.status as VendorStatus,
          isPublic: vendor.is_public,
        },
      } satisfies CurrentVendorMembership;
    })
    .filter((membership): membership is CurrentVendorMembership => Boolean(membership));
}

export function validDashboardMemberships(
  memberships: CurrentVendorMembership[],
) {
  return memberships.filter((membership) => membership.vendor.status !== "archived");
}
