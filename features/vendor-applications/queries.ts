import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { VendorApplicationDocument, VendorApplicationRow } from "./types";
import { vendorApplicationDocumentBucket } from "./validators";

export async function listVendorApplications() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("vendor_applications")
    .select(
      `
        id,
        status,
        owner_full_name,
        owner_email,
        legal_business_name,
        store_name_en,
        store_name_ar,
        proposed_store_slug,
        reviewed_at,
        created_at
      `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Pick<
    VendorApplicationRow,
    | "id"
    | "status"
    | "owner_full_name"
    | "owner_email"
    | "legal_business_name"
    | "store_name_en"
    | "store_name_ar"
    | "proposed_store_slug"
    | "reviewed_at"
    | "created_at"
  >[];
}

export async function getVendorApplicationById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("vendor_applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as VendorApplicationRow | null;
}

export async function getVendorApplicationDocuments(
  application: VendorApplicationRow,
): Promise<VendorApplicationDocument[]> {
  await requireAdmin();

  const documents = [
    {
      label: "Owner civil ID/passport",
      path: application.owner_civil_id_or_passport_document_path,
    },
    {
      label: "Commercial license",
      path: application.commercial_license_document_path,
    },
    application.authorization_document_path
      ? {
          label: "Authorization document",
          path: application.authorization_document_path,
        }
      : null,
  ].filter(Boolean) as { label: string; path: string }[];

  const supabase = createSupabaseAdminClient();
  const signedDocuments = await Promise.all(
    documents.map(async (document) => {
      const { data, error } = await supabase.storage
        .from(vendorApplicationDocumentBucket)
        .createSignedUrl(document.path, 300);

      if (error) {
        throw new Error(error.message);
      }

      return {
        ...document,
        signedUrl: data.signedUrl,
      };
    }),
  );

  return signedDocuments;
}
