import { createSlug, normalizeSlug } from "@/lib/utils/slug";
import { vendorStatuses, vendorUserRoles, type VendorStatus, type VendorUserRole } from "./types";

export type VendorInput = {
  name_en: string;
  name_ar: string | null;
  description_en: string | null;
  description_ar: string | null;
  slug: string;
  status: VendorStatus;
  is_public: boolean;
};

export type VendorUserInput = {
  user_id: string;
  role: VendorUserRole;
  is_active: boolean;
};

export type VendorUserUpdateInput = {
  role: VendorUserRole;
  is_active: boolean;
};

function optionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function requiredText(value: FormDataEntryValue | null, label: string) {
  const text = String(value ?? "").trim();

  if (!text) {
    throw new Error(`${label} is required.`);
  }

  return text;
}

function requireValidUuid(value: FormDataEntryValue | null, label: string) {
  const text = requiredText(value, label);

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)) {
    throw new Error(`${label} must be a valid UUID.`);
  }

  return text;
}

export function parseVendorFormData(formData: FormData): VendorInput {
  const name_en = requiredText(formData.get("name_en"), "English name");
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const slug = rawSlug ? normalizeSlug(rawSlug) : createSlug(name_en);
  const status = String(formData.get("status") ?? "");

  if (!slug) {
    throw new Error("Slug is required.");
  }

  if (!vendorStatuses.includes(status as VendorStatus)) {
    throw new Error("Vendor status is invalid.");
  }

  return {
    name_en,
    name_ar: optionalText(formData.get("name_ar")),
    description_en: optionalText(formData.get("description_en")),
    description_ar: optionalText(formData.get("description_ar")),
    slug,
    status: status as VendorStatus,
    is_public: formData.get("is_public") === "on",
  };
}

export function parseVendorUserFormData(formData: FormData): VendorUserInput {
  const role = String(formData.get("role") ?? "");

  if (!vendorUserRoles.includes(role as VendorUserRole)) {
    throw new Error("Vendor user role is invalid.");
  }

  return {
    user_id: requireValidUuid(formData.get("user_id"), "Auth user UUID"),
    role: role as VendorUserRole,
    is_active: formData.get("is_active") === "on",
  };
}

export function parseVendorUserUpdateFormData(
  formData: FormData,
): VendorUserUpdateInput {
  const role = String(formData.get("role") ?? "");

  if (!vendorUserRoles.includes(role as VendorUserRole)) {
    throw new Error("Vendor user role is invalid.");
  }

  return {
    role: role as VendorUserRole,
    is_active: formData.get("is_active") === "on",
  };
}
