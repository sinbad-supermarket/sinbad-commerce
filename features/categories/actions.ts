"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseCategoryFormData } from "./validators";

function categoryErrorRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function assertSlugIsUnique(slug: string, currentCategoryId?: string) {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("categories").select("id").eq("slug", slug).limit(1);

  if (currentCategoryId) {
    query = query.neq("id", currentCategoryId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  if (data && data.length > 0) {
    throw new Error("Slug is already in use.");
  }
}

async function assertParentIsValid(parentId: string | null, currentCategoryId?: string) {
  if (!parentId) {
    return;
  }

  if (currentCategoryId && parentId === currentCategoryId) {
    throw new Error("A category cannot be its own parent.");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id")
    .eq("id", parentId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Selected parent category does not exist.");
  }
}

export async function createCategory(formData: FormData) {
  await requireAdmin();

  try {
    const input = parseCategoryFormData(formData);
    await assertSlugIsUnique(input.slug);
    await assertParentIsValid(input.parent_id);

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("categories").insert(input);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    categoryErrorRedirect(
      "/admin/categories/new",
      error instanceof Error ? error.message : "Unable to create category.",
    );
  }

  redirect("/admin/categories");
}

export async function updateCategory(categoryId: string, formData: FormData) {
  await requireAdmin();

  try {
    const input = parseCategoryFormData(formData);
    await assertSlugIsUnique(input.slug, categoryId);
    await assertParentIsValid(input.parent_id, categoryId);

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("categories")
      .update(input)
      .eq("id", categoryId);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    categoryErrorRedirect(
      `/admin/categories/${categoryId}`,
      error instanceof Error ? error.message : "Unable to update category.",
    );
  }

  redirect("/admin/categories");
}

export async function setCategoryActive(categoryId: string, isActive: boolean) {
  await requireAdmin();

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("categories")
    .update({ is_active: isActive })
    .eq("id", categoryId);

  if (error) {
    categoryErrorRedirect(`/admin/categories/${categoryId}`, error.message);
  }

  redirect("/admin/categories");
}
