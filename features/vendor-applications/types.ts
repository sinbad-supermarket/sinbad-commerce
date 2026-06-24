export const vendorApplicationStatuses = [
  "submitted",
  "under_review",
  "approved",
  "rejected",
] as const;

export type VendorApplicationStatus = (typeof vendorApplicationStatuses)[number];

export const deliveryHandledByOptions = ["sinbad", "vendor", "undecided"] as const;

export type DeliveryHandledBy = (typeof deliveryHandledByOptions)[number];

export type VendorApplicationRow = {
  id: string;
  status: VendorApplicationStatus;
  owner_full_name: string;
  owner_phone: string;
  owner_email: string;
  owner_civil_id_or_passport_number: string;
  owner_civil_id_or_passport_document_path: string | null;
  authorized_signatory_name: string | null;
  authorized_signatory_phone: string | null;
  authorization_document_path: string | null;
  emergency_contact_phone: string | null;
  owner_notes: string | null;
  legal_business_name: string;
  commercial_license_number: string;
  commercial_license_document_path: string | null;
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
  bank_document_path: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  admin_notes: string | null;
  approved_vendor_id: string | null;
  vendor_login_email: string | null;
  created_at: string;
  updated_at: string;
};

export type VendorApplicationDocument = {
  label: string;
  path: string;
  signedUrl: string;
};
