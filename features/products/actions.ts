"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseProductFormData } from "./validators";

function productErrorRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function assertUniqueField(
  field: "slug" | "sku" | "barcode",
  value: string | null,
  currentProductId?: string,
) {
  if (!value) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  let query = supabase.from("products").select("id").eq(field, value).limit(1);

  if (currentProductId) {
    query = query.neq("id", currentProductId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  if (data && data.length > 0) {
    throw new Error(`${field === "slug" ? "Slug" : field.toUpperCase()} is already in use.`);
  }
}

async function assertCategoriesExist(categoryIds: string[]) {
  if (categoryIds.length === 0) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id")
    .in("id", categoryIds);

  if (error) {
    throw new Error(error.message);
  }

  if ((data ?? []).length !== categoryIds.length) {
    throw new Error("One or more selected categories do not exist.");
  }
}

async function replaceProductCategories(
  productId: string,
  categoryIds: string[],
  primaryCategoryId: string | null,
) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("replace_product_category_assignments", {
    p_product_id: productId,
    p_category_ids: categoryIds,
    p_primary_category_id: primaryCategoryId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function createProduct(formData: FormData) {
  await requireAdmin();

  try {
    const { product, categories } = parseProductFormData(formData);
    await assertUniqueField("slug", product.slug);
    await assertUniqueField("sku", product.sku);
    await assertUniqueField("barcode", product.barcode);
    await assertCategoriesExist(categories.categoryIds);

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .insert(product)
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    await replaceProductCategories(
      data.id,
      categories.categoryIds,
      categories.primaryCategoryId,
    );
  } catch (error) {
    productErrorRedirect(
      "/admin/products/new",
      error instanceof Error ? error.message : "Unable to create product.",
    );
  }

  redirect("/admin/products");
}

export async function updateProduct(productId: string, formData: FormData) {
  await requireAdmin();

  try {
    const { product, categories } = parseProductFormData(formData);
    await assertUniqueField("slug", product.slug, productId);
    await assertUniqueField("sku", product.sku, productId);
    await assertUniqueField("barcode", product.barcode, productId);
    await assertCategoriesExist(categories.categoryIds);

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("products").update(product).eq("id", productId);

    if (error) {
      throw new Error(error.message);
    }

    await replaceProductCategories(
      productId,
      categories.categoryIds,
      categories.primaryCategoryId,
    );
  } catch (error) {
    productErrorRedirect(
      `/admin/products/${productId}`,
      error instanceof Error ? error.message : "Unable to update product.",
    );
  }

  redirect("/admin/products");
}
