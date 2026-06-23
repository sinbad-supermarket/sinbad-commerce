import { normalizeSlug } from "@/lib/utils/slug";
import { deliveryHandledByOptions, type DeliveryHandledBy } from "./types";

export const vendorApplicationDocumentBucket = "vendor-application-documents";
export const maxVendorApplicationDocumentSize = 3 * 1024 * 1024;
export const maxVendorApplicationDocumentTotalSize = 10 * 1024 * 1024;
export const vendorApplicationDocumentSizeMessage =
  "Each document must be 3 MB or smaller. Please upload a smaller/compressed file.";
export const vendorApplicationDocumentTotalSizeMessage =
  "Total document upload size must be 10 MB or smaller. Please reduce file sizes and try again.";
export const allowedVendorApplicationDocumentMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

type AllowedVendorApplicationDocumentMimeType =
  (typeof allowedVendorApplicationDocumentMimeTypes)[number];

export type VendorApplicationInput = {
  owner_full_name: string;
  owner_phone: string;
  owner_email: string;
  owner_civil_id_or_passport_number: string;
  authorized_signatory_name: string | null;
  authorized_signatory_phone: string | null;
  emergency_contact_phone: string | null;
  owner_notes: string | null;
  legal_business_name: string;
  commercial_license_number: string;
  business_address: string;
  tax_or_vat_number: string | null;
  company_notes: string | null;
  store_name_en: string;
  store_name_ar: string;
  proposed_store_slug: string;
  store_phone: string;
  store_whatsapp: string;
  store_order_email: string;
  store_area: string;
  store_fulfillment_address: string;
  product_categories_description: string;
  short_store_description_en: string;
  short_store_description_ar: string;
  store_business_hours: string | null;
  expected_daily_order_capacity: number | null;
  return_policy_notes: string | null;
  delivery_handled_by: DeliveryHandledBy | null;
  bank_name: string;
  account_holder_name: string;
  iban: string;
  account_number: string | null;
  bank_branch: string | null;
};

export type VendorApplicationFiles = {
  ownerDocument: File;
  licenseDocument: File;
  authorizationDocument: File | null;
  bankDocument: File | null;
};

export function optionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

export function requiredText(value: FormDataEntryValue | null, label: string) {
  const text = String(value ?? "").trim();

  if (!text) {
    throw new Error(`${label} is required.`);
  }

  return text;
}

function requiredEmail(value: FormDataEntryValue | null, label: string) {
  const email = requiredText(value, label).toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(`${label} must be a valid email address.`);
  }

  return email;
}

function requiredPhone(value: FormDataEntryValue | null, label: string) {
  const phone = requiredText(value, label);

  if (!/^[+\d][+\d\s().-]{5,}$/.test(phone)) {
    throw new Error(`${label} must be a valid phone number.`);
  }

  return phone;
}

function optionalPhone(value: FormDataEntryValue | null, label: string) {
  const phone = optionalText(value);

  if (phone && !/^[+\d][+\d\s().-]{5,}$/.test(phone)) {
    throw new Error(`${label} must be a valid phone number.`);
  }

  return phone;
}

function optionalInteger(value: FormDataEntryValue | null, label: string) {
  const text = optionalText(value);

  if (!text) {
    return null;
  }

  if (!/^\d+$/.test(text)) {
    throw new Error(`${label} must be a whole number.`);
  }

  return Number(text);
}

function optionalDeliveryHandledBy(value: FormDataEntryValue | null) {
  const text = optionalText(value);

  if (!text) {
    return null;
  }

  if (!deliveryHandledByOptions.includes(text as DeliveryHandledBy)) {
    throw new Error("Delivery handling option is invalid.");
  }

  return text as DeliveryHandledBy;
}

export function extensionForVendorApplicationDocument(mimeType: string) {
  switch (mimeType) {
    case "application/pdf":
      return "pdf";
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      throw new Error("Document file type is not supported.");
  }
}

function requiredDocument(value: FormDataEntryValue | null, label: string) {
  if (!(value instanceof File) || value.size === 0) {
    throw new Error(`${label} is required.`);
  }

  if (value.size > maxVendorApplicationDocumentSize) {
    throw new Error(vendorApplicationDocumentSizeMessage);
  }

  if (!allowedVendorApplicationDocumentMimeTypes.includes(value.type as AllowedVendorApplicationDocumentMimeType)) {
    throw new Error(`${label} must be a PDF, JPG, PNG, or WebP file.`);
  }

  return value;
}

function optionalDocument(value: FormDataEntryValue | null, label: string) {
  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  return requiredDocument(value, label);
}

function signatoryDiffersFromOwner(ownerName: string, signatoryName: string | null) {
  return Boolean(
    signatoryName &&
      signatoryName.trim().toLowerCase() !== ownerName.trim().toLowerCase(),
  );
}

export function parseVendorApplicationFormData(formData: FormData): {
  input: VendorApplicationInput;
  files: VendorApplicationFiles;
} {
  const owner_full_name = requiredText(formData.get("owner_full_name"), "Owner full name");
  const authorized_signatory_name = optionalText(formData.get("authorized_signatory_name"));
  const rawSlug = requiredText(formData.get("proposed_store_slug"), "Proposed store slug");
  const proposed_store_slug = normalizeSlug(rawSlug);

  if (!proposed_store_slug) {
    throw new Error("Proposed store slug is required.");
  }

  const authorizationDocument = optionalDocument(
    formData.get("authorization_document"),
    "Authorization document",
  );

  if (signatoryDiffersFromOwner(owner_full_name, authorized_signatory_name) && !authorizationDocument) {
    throw new Error("Authorization document is required when the signatory differs from the owner.");
  }

  const ownerDocument = requiredDocument(
    formData.get("owner_civil_id_or_passport_document"),
    "Owner civil ID/passport document",
  );
  const licenseDocument = requiredDocument(
    formData.get("commercial_license_document"),
    "Commercial license document",
  );
  const bankDocument = optionalDocument(formData.get("bank_document"), "Bank document");
  const totalDocumentSize = [
    ownerDocument,
    licenseDocument,
    authorizationDocument,
    bankDocument,
  ].reduce((total, file) => total + (file?.size ?? 0), 0);

  if (totalDocumentSize > maxVendorApplicationDocumentTotalSize) {
    throw new Error(vendorApplicationDocumentTotalSizeMessage);
  }

  return {
    input: {
      owner_full_name,
      owner_phone: requiredPhone(formData.get("owner_phone"), "Owner phone"),
      owner_email: requiredEmail(formData.get("owner_email"), "Owner email"),
      owner_civil_id_or_passport_number: requiredText(
        formData.get("owner_civil_id_or_passport_number"),
        "Civil ID or passport number",
      ),
      authorized_signatory_name,
      authorized_signatory_phone: optionalPhone(
        formData.get("authorized_signatory_phone"),
        "Authorized signatory phone",
      ),
      emergency_contact_phone: optionalPhone(
        formData.get("emergency_contact_phone"),
        "Emergency contact phone",
      ),
      owner_notes: optionalText(formData.get("owner_notes")),
      legal_business_name: requiredText(formData.get("legal_business_name"), "Legal business name"),
      commercial_license_number: requiredText(
        formData.get("commercial_license_number"),
        "Commercial license number",
      ),
      business_address: requiredText(formData.get("business_address"), "Business address"),
      tax_or_vat_number: optionalText(formData.get("tax_or_vat_number")),
      company_notes: optionalText(formData.get("company_notes")),
      store_name_en: requiredText(formData.get("store_name_en"), "Store English name"),
      store_name_ar: requiredText(formData.get("store_name_ar"), "Store Arabic name"),
      proposed_store_slug,
      store_phone: requiredPhone(formData.get("store_phone"), "Store phone"),
      store_whatsapp: requiredPhone(formData.get("store_whatsapp"), "Store WhatsApp"),
      store_order_email: requiredEmail(formData.get("store_order_email"), "Store order email"),
      store_area: requiredText(formData.get("store_area"), "Store area"),
      store_fulfillment_address: requiredText(
        formData.get("store_fulfillment_address"),
        "Store fulfillment address",
      ),
      product_categories_description: requiredText(
        formData.get("product_categories_description"),
        "Product categories description",
      ),
      short_store_description_en: requiredText(
        formData.get("short_store_description_en"),
        "Short English store description",
      ),
      short_store_description_ar: requiredText(
        formData.get("short_store_description_ar"),
        "Short Arabic store description",
      ),
      store_business_hours: optionalText(formData.get("store_business_hours")),
      expected_daily_order_capacity: optionalInteger(
        formData.get("expected_daily_order_capacity"),
        "Expected daily order capacity",
      ),
      return_policy_notes: optionalText(formData.get("return_policy_notes")),
      delivery_handled_by: optionalDeliveryHandledBy(formData.get("delivery_handled_by")),
      bank_name: requiredText(formData.get("bank_name"), "Bank name"),
      account_holder_name: requiredText(
        formData.get("account_holder_name"),
        "Account holder name",
      ),
      iban: requiredText(formData.get("iban"), "IBAN"),
      account_number: optionalText(formData.get("account_number")),
      bank_branch: optionalText(formData.get("bank_branch")),
    },
    files: {
      ownerDocument,
      licenseDocument,
      authorizationDocument,
      bankDocument,
    },
  };
}

export function parseRequiredRejectionReason(formData: FormData) {
  return requiredText(formData.get("rejection_reason"), "Rejection reason");
}

export function parseOptionalAdminNotes(formData: FormData) {
  return optionalText(formData.get("admin_notes"));
}

export function parseVendorLoginEmail(formData: FormData, fallbackEmail: string) {
  const value = optionalText(formData.get("vendor_login_email"));

  if (!value) {
    return fallbackEmail.toLowerCase();
  }

  return requiredEmail(value, "Vendor login email");
}
