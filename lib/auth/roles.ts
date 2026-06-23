export const adminRoles = ["owner", "admin", "editor"] as const;

export type AdminRole = (typeof adminRoles)[number];

export function isAdminRole(value: string | null | undefined): value is AdminRole {
  return adminRoles.includes(value as AdminRole);
}
