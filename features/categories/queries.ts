import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CategoryRow } from "./types";

export async function listAdminCategories() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name_en", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CategoryRow[];
}

export async function getAdminCategoryById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as CategoryRow | null;
}

export async function listParentCategoryOptions(excludeId?: string) {
  const categories = await listAdminCategories();
  return categories.filter((category) => category.id !== excludeId);
}

export async function listActiveParentCategories() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .is("parent_id", null)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name_en", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CategoryRow[];
}

export async function listActiveSubcategoriesByParent(parentId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("parent_id", parentId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name_en", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CategoryRow[];
}
