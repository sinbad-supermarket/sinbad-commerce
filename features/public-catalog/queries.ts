import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createPublicProductImageSignedUrl } from "./images";
import { pageInfo, paginationRange, publicCatalogPageSize } from "./pagination";
import type {
  PaginatedProducts,
  PublicCategory,
  PublicImage,
  PublicProduct,
} from "./types";

type ProductRow = {
  id: string;
  slug: string;
  sku: string | null;
  barcode: string | null;
  name_en: string;
  name_ar: string;
  short_description_en: string | null;
  short_description_ar: string | null;
  description_en: string | null;
  description_ar: string | null;
  price: string | number | null;
};

type ImageRow = {
  id: string;
  product_id: string;
  storage_path: string;
  alt_text_en: string | null;
  alt_text_ar: string | null;
  sort_order: number;
  is_primary: boolean;
};

type AssignmentRow = {
  product_id: string;
  category_id: string;
  is_primary: boolean;
};

const publicProductSelect = `
  id,
  slug,
  sku,
  barcode,
  name_en,
  name_ar,
  short_description_en,
  short_description_ar,
  description_en,
  description_ar,
  price,
  vendors!inner(status,is_public)
`;

export async function listPublicCategories() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id,slug,name_en,name_ar,description_en,description_ar,parent_id,sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name_en", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as PublicCategory[];
}

export async function getPublicCategoryBySlug(slug: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id,slug,name_en,name_ar,description_en,description_ar,parent_id,sort_order")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as PublicCategory | null;
}

async function listPrimaryImages(productIds: string[]) {
  if (productIds.length === 0) {
    return new Map<string, PublicImage>();
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("product_images")
    .select("id,product_id,storage_path,alt_text_en,alt_text_ar,sort_order,is_primary")
    .in("product_id", productIds)
    .eq("is_primary", true);

  if (error) {
    throw new Error(error.message);
  }

  const entries = await Promise.all(
    ((data ?? []) as ImageRow[]).map(async (image) => {
      const signedUrl = await createPublicProductImageSignedUrl(image.storage_path);
      return [
        image.product_id,
        {
          id: image.id,
          storage_path: image.storage_path,
          alt_text_en: image.alt_text_en,
          alt_text_ar: image.alt_text_ar,
          sort_order: image.sort_order,
          is_primary: image.is_primary,
          signedUrl,
        },
      ] as const;
    }),
  );

  return new Map(entries);
}

async function listProductCategories(productIds: string[]) {
  if (productIds.length === 0) {
    return {
      categoriesByProduct: new Map<string, PublicCategory[]>(),
      primaryCategoryByProduct: new Map<string, PublicCategory>(),
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: assignments, error: assignmentError } = await supabase
    .from("product_categories")
    .select("product_id,category_id,is_primary")
    .in("product_id", productIds);

  if (assignmentError) {
    throw new Error(assignmentError.message);
  }

  const assignmentRows = (assignments ?? []) as AssignmentRow[];
  const categoryIds = Array.from(
    new Set(assignmentRows.map((assignment) => assignment.category_id)),
  );

  if (categoryIds.length === 0) {
    return {
      categoriesByProduct: new Map<string, PublicCategory[]>(),
      primaryCategoryByProduct: new Map<string, PublicCategory>(),
    };
  }

  const { data: categories, error: categoryError } = await supabase
    .from("categories")
    .select("id,slug,name_en,name_ar,description_en,description_ar,parent_id,sort_order")
    .in("id", categoryIds)
    .eq("is_active", true);

  if (categoryError) {
    throw new Error(categoryError.message);
  }

  const categoryById = new Map(
    ((categories ?? []) as PublicCategory[]).map((category) => [category.id, category]),
  );
  const categoriesByProduct = new Map<string, PublicCategory[]>();
  const primaryCategoryByProduct = new Map<string, PublicCategory>();

  assignmentRows.forEach((assignment) => {
    const category = categoryById.get(assignment.category_id);

    if (!category) {
      return;
    }

    const productCategories = categoriesByProduct.get(assignment.product_id) ?? [];
    productCategories.push(category);
    categoriesByProduct.set(assignment.product_id, productCategories);

    if (assignment.is_primary) {
      primaryCategoryByProduct.set(assignment.product_id, category);
    }
  });

  return { categoriesByProduct, primaryCategoryByProduct };
}

async function hydrateProducts(products: ProductRow[]) {
  const productIds = products.map((product) => product.id);
  const [imagesByProduct, categoryData] = await Promise.all([
    listPrimaryImages(productIds),
    listProductCategories(productIds),
  ]);

  return products.map<PublicProduct>((product) => ({
    ...product,
    primaryCategory: categoryData.primaryCategoryByProduct.get(product.id) ?? null,
    primaryImage: imagesByProduct.get(product.id) ?? null,
    categories: categoryData.categoriesByProduct.get(product.id) ?? [],
  }));
}

export async function getPublicProductsByIds(productIds: string[]) {
  if (productIds.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(publicProductSelect)
    .in("id", productIds)
    .eq("status", "active")
    .eq("review_status", "approved")
    .eq("vendors.status", "active")
    .eq("vendors.is_public", true);

  if (error) {
    throw new Error(error.message);
  }

  const productsById = new Map(
    ((data ?? []) as ProductRow[]).map((product) => [product.id, product]),
  );
  const orderedProducts = productIds
    .map((productId) => productsById.get(productId))
    .filter((product): product is ProductRow => Boolean(product));

  return hydrateProducts(orderedProducts);
}

export async function listPublicProducts(page: number): Promise<PaginatedProducts> {
  const supabase = await createSupabaseServerClient();
  const { from, to } = paginationRange(page);
  const { data, error, count } = await supabase
    .from("products")
    .select(publicProductSelect, { count: "exact" })
    .eq("status", "active")
    .eq("review_status", "approved")
    .eq("vendors.status", "active")
    .eq("vendors.is_public", true)
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const products = await hydrateProducts((data ?? []) as ProductRow[]);
  const totalCount = count ?? 0;

  return {
    ...pageInfo(page, totalCount, publicCatalogPageSize),
    products,
    totalCount,
  };
}

export async function listLatestPublicProducts(limit: number) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(publicProductSelect)
    .eq("status", "active")
    .eq("review_status", "approved")
    .eq("vendors.status", "active")
    .eq("vendors.is_public", true)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return hydrateProducts((data ?? []) as ProductRow[]);
}

export async function getPublicProductBySlug(slug: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(publicProductSelect)
    .eq("slug", slug)
    .eq("status", "active")
    .eq("review_status", "approved")
    .eq("vendors.status", "active")
    .eq("vendors.is_public", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const [product] = await hydrateProducts([data as ProductRow]);
  return product;
}

export async function listPublicProductsByCategory(
  categoryId: string,
  page: number,
): Promise<PaginatedProducts> {
  const supabase = await createSupabaseServerClient();
  const { from, to } = paginationRange(page);
  const { data, error, count } = await supabase
    .from("products")
    .select(`${publicProductSelect},product_categories!inner(category_id)`, { count: "exact" })
    .eq("product_categories.category_id", categoryId)
    .eq("status", "active")
    .eq("review_status", "approved")
    .eq("vendors.status", "active")
    .eq("vendors.is_public", true)
    .order("updated_at", { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  return {
    ...pageInfo(page, count ?? 0, publicCatalogPageSize),
    products: await hydrateProducts((data ?? []) as ProductRow[]),
    totalCount: count ?? 0,
  };
}
