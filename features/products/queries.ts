import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ProductCategoryAssignment,
  ProductListItem,
  ProductRow,
} from "./types";

export async function listAdminProducts() {
  const supabase = await createSupabaseServerClient();
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*")
    .order("updated_at", { ascending: false });

  if (productsError) {
    throw new Error(productsError.message);
  }

  const { data: assignments, error: assignmentsError } = await supabase
    .from("product_categories")
    .select("product_id,category_id,is_primary")
    .eq("is_primary", true);

  if (assignmentsError) {
    throw new Error(assignmentsError.message);
  }

  const categoryIds = Array.from(
    new Set((assignments ?? []).map((assignment) => assignment.category_id)),
  );
  const categoryNames = new Map<string, string>();

  if (categoryIds.length > 0) {
    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select("id,name_en")
      .in("id", categoryIds);

    if (categoriesError) {
      throw new Error(categoriesError.message);
    }

    categories?.forEach((category) => {
      categoryNames.set(category.id, category.name_en);
    });
  }

  const primaryByProduct = new Map<string, string>();
  assignments?.forEach((assignment) => {
    primaryByProduct.set(assignment.product_id, assignment.category_id);
  });

  return ((products ?? []) as ProductRow[]).map<ProductListItem>((product) => {
    const primaryCategoryId = primaryByProduct.get(product.id);
    return {
      ...product,
      primaryCategoryName: primaryCategoryId
        ? categoryNames.get(primaryCategoryId) ?? null
        : null,
    };
  });
}

export async function getAdminProductById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as ProductRow | null;
}

export async function listProductCategoryAssignments(productId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("product_categories")
    .select("product_id,category_id,is_primary")
    .eq("product_id", productId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ProductCategoryAssignment[];
}
