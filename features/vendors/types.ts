export const vendorStatuses = ["pending", "active", "suspended", "archived"] as const;
export const vendorUserRoles = ["owner", "manager", "editor"] as const;

export type VendorStatus = (typeof vendorStatuses)[number];
export type VendorUserRole = (typeof vendorUserRoles)[number];

export type VendorRow = {
  id: string;
  name_en: string;
  name_ar: string | null;
  slug: string;
  description_en: string | null;
  description_ar: string | null;
  logo_path: string | null;
  banner_path: string | null;
  status: VendorStatus;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export type VendorUserRow = {
  id: string;
  vendor_id: string;
  user_id: string;
  role: VendorUserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
