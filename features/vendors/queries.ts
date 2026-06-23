import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { VendorRow, VendorUserRow } from "./types";

export async function listAdminVendors() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as VendorRow[];
}

export async function getAdminVendorById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("vendors")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as VendorRow | null;
}

export async function listVendorUsers(vendorId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("vendor_users")
    .select("*")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as VendorUserRow[];
}
