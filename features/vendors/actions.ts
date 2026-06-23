"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  parseVendorFormData,
  parseVendorUserFormData,
  parseVendorUserUpdateFormData,
} from "./validators";

function vendorErrorRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function assertVendorSlugIsUnique(slug: string, currentVendorId?: string) {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("vendors").select("id").eq("slug", slug).limit(1);

  if (currentVendorId) {
    query = query.neq("id", currentVendorId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  if (data && data.length > 0) {
    throw new Error("Slug is already in use.");
  }
}

export async function createVendor(formData: FormData) {
  await requireAdmin();

  try {
    const input = parseVendorFormData(formData);
    await assertVendorSlugIsUnique(input.slug);

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("vendors").insert(input);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    vendorErrorRedirect(
      "/admin/vendors/new",
      error instanceof Error ? error.message : "Unable to create vendor.",
    );
  }

  redirect("/admin/vendors");
}

export async function updateVendor(vendorId: string, formData: FormData) {
  await requireAdmin();

  try {
    const input = parseVendorFormData(formData);
    await assertVendorSlugIsUnique(input.slug, vendorId);

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("vendors")
      .update(input)
      .eq("id", vendorId);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    vendorErrorRedirect(
      `/admin/vendors/${vendorId}`,
      error instanceof Error ? error.message : "Unable to update vendor.",
    );
  }

  redirect("/admin/vendors");
}

export async function assignVendorUser(vendorId: string, formData: FormData) {
  await requireAdmin();

  try {
    const input = parseVendorUserFormData(formData);
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("vendor_users").upsert(
      {
        vendor_id: vendorId,
        ...input,
      },
      {
        onConflict: "vendor_id,user_id",
      },
    );

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    vendorErrorRedirect(
      `/admin/vendors/${vendorId}`,
      error instanceof Error ? error.message : "Unable to assign vendor user.",
    );
  }

  redirect(`/admin/vendors/${vendorId}`);
}

export async function updateVendorUser(
  vendorId: string,
  vendorUserId: string,
  formData: FormData,
) {
  await requireAdmin();

  try {
    const input = parseVendorUserUpdateFormData(formData);
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("vendor_users")
      .update(input)
      .eq("id", vendorUserId)
      .eq("vendor_id", vendorId);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    vendorErrorRedirect(
      `/admin/vendors/${vendorId}`,
      error instanceof Error ? error.message : "Unable to update vendor user.",
    );
  }

  redirect(`/admin/vendors/${vendorId}`);
}
