"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  documentExtensionForVendorApplicationFile,
  parseOptionalAdminNotes,
  parseRequiredRejectionReason,
  parseVendorApplicationFormData,
  parseVendorLoginEmail,
  vendorApplicationDocumentBucket,
} from "./validators";
import type { VendorApplicationRow } from "./types";

function applicationErrorRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function applicationSuccessRedirect(path: string, message: string): never {
  redirect(`${path}?success=${encodeURIComponent(message)}`);
}

function documentPath(applicationId: string, label: string, file: File) {
  const extension = documentExtensionForVendorApplicationFile(file);
  return `vendor-applications/${applicationId}/${label}-${randomUUID()}.${extension}`;
}

async function uploadDocument(path: string, file: File) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage
    .from(vendorApplicationDocumentBucket)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }
}

async function getApplicationForReview(applicationId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("vendor_applications")
    .select("*")
    .eq("id", applicationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Vendor application was not found.");
  }

  return data as VendorApplicationRow;
}

async function assertVendorSlugIsAvailable(slug: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("vendors")
    .select("id")
    .eq("slug", slug)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  if (data && data.length > 0) {
    throw new Error("Proposed store slug is already used by another vendor.");
  }
}

export async function submitVendorApplication(formData: FormData) {
  try {
    const { input, files } = parseVendorApplicationFormData(formData);
    const applicationId = randomUUID();
    const ownerDocumentPath = files.ownerDocument
      ? documentPath(applicationId, "owner-id", files.ownerDocument)
      : null;
    const licenseDocumentPath = files.licenseDocument
      ? documentPath(applicationId, "license", files.licenseDocument)
      : null;
    const authorizationDocumentPath = files.authorizationDocument
      ? documentPath(applicationId, "authorization", files.authorizationDocument)
      : null;
    const bankDocumentPath = files.bankDocument
      ? documentPath(applicationId, "bank", files.bankDocument)
      : null;

    if (files.ownerDocument && ownerDocumentPath) {
      await uploadDocument(ownerDocumentPath, files.ownerDocument);
    }

    if (files.licenseDocument && licenseDocumentPath) {
      await uploadDocument(licenseDocumentPath, files.licenseDocument);
    }

    if (files.authorizationDocument && authorizationDocumentPath) {
      await uploadDocument(authorizationDocumentPath, files.authorizationDocument);
    }

    if (files.bankDocument && bankDocumentPath) {
      await uploadDocument(bankDocumentPath, files.bankDocument);
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("vendor_applications").insert({
      id: applicationId,
      ...input,
      owner_civil_id_or_passport_document_path: ownerDocumentPath,
      commercial_license_document_path: licenseDocumentPath,
      authorization_document_path: authorizationDocumentPath,
      bank_document_path: bankDocumentPath,
    });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    applicationErrorRedirect(
      "/vendors/apply",
      error instanceof Error ? error.message : "Unable to submit vendor application.",
    );
  }

  applicationSuccessRedirect(
    "/vendors/apply",
    "Application submitted. Our admin team will review your details and contact you to request the required documents.",
  );
}

export async function markVendorApplicationUnderReview(applicationId: string) {
  const admin = await requireAdmin();

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("vendor_applications")
      .update({
        status: "under_review",
        reviewed_by: admin.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", applicationId)
      .in("status", ["submitted", "under_review"])
      .select("id")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("Only submitted applications can be marked under review.");
    }
  } catch (error) {
    applicationErrorRedirect(
      `/admin/vendor-applications/${applicationId}`,
      error instanceof Error ? error.message : "Unable to mark application under review.",
    );
  }

  redirect(`/admin/vendor-applications/${applicationId}`);
}

export async function approveVendorApplication(applicationId: string, formData: FormData) {
  const admin = await requireAdmin();

  try {
    const application = await getApplicationForReview(applicationId);

    if (!["submitted", "under_review"].includes(application.status)) {
      throw new Error("Only submitted or under-review applications can be approved.");
    }

    await assertVendorSlugIsAvailable(application.proposed_store_slug);

    const vendorLoginEmail = parseVendorLoginEmail(formData, application.owner_email);
    const adminNotes = parseOptionalAdminNotes(formData);
    const supabase = await createSupabaseServerClient();
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .insert({
        name_en: application.store_name_en,
        name_ar: application.store_name_ar,
        slug: application.proposed_store_slug,
        description_en: application.short_store_description_en,
        description_ar: application.short_store_description_ar,
        status: "active",
        is_public: false,
      })
      .select("id")
      .single();

    if (vendorError) {
      throw new Error(vendorError.message);
    }

    const { error: applicationError } = await supabase
      .from("vendor_applications")
      .update({
        status: "approved",
        approved_vendor_id: vendor.id,
        vendor_login_email: vendorLoginEmail,
        admin_notes: adminNotes,
        reviewed_by: admin.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", applicationId)
      .in("status", ["submitted", "under_review"]);

    if (applicationError) {
      throw new Error(applicationError.message);
    }
  } catch (error) {
    applicationErrorRedirect(
      `/admin/vendor-applications/${applicationId}`,
      error instanceof Error ? error.message : "Unable to approve vendor application.",
    );
  }

  redirect(`/admin/vendor-applications/${applicationId}`);
}

export async function rejectVendorApplication(applicationId: string, formData: FormData) {
  const admin = await requireAdmin();

  try {
    const rejectionReason = parseRequiredRejectionReason(formData);
    const adminNotes = parseOptionalAdminNotes(formData);
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("vendor_applications")
      .update({
        status: "rejected",
        rejection_reason: rejectionReason,
        admin_notes: adminNotes,
        reviewed_by: admin.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", applicationId)
      .in("status", ["submitted", "under_review"])
      .select("id")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("Only submitted or under-review applications can be rejected.");
    }
  } catch (error) {
    applicationErrorRedirect(
      `/admin/vendor-applications/${applicationId}`,
      error instanceof Error ? error.message : "Unable to reject vendor application.",
    );
  }

  redirect(`/admin/vendor-applications/${applicationId}`);
}
