export const vendorRoles = ["owner", "manager", "editor"] as const;

export type VendorRole = (typeof vendorRoles)[number];

export function isVendorRole(role: string): role is VendorRole {
  return vendorRoles.includes(role as VendorRole);
}
