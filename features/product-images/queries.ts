import { createSupabaseServerClient } from "@/lib/supabase/server";
import { productImageBucket } from "./validators";
import type { ProductImageListItem, ProductImageRow } from "./types";

export async function listProductImages(productId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("product_images")
    .select("*")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const images = (data ?? []) as ProductImageRow[];

  return Promise.all(
    images.map<Promise<ProductImageListItem>>(async (image) => {
      const { data: signedData } = await supabase.storage
        .from(productImageBucket)
        .createSignedUrl(image.storage_path, 60 * 10);

      return {
        ...image,
        signedUrl: signedData?.signedUrl ?? null,
      };
    }),
  );
}

export async function getProductImageById(imageId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("product_images")
    .select("*")
    .eq("id", imageId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as ProductImageRow | null;
}

export async function countProductImages(productId: string) {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}
