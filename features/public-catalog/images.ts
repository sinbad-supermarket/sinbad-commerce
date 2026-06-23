import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { productImageBucket } from "@/features/product-images/validators";

export async function createPublicProductImageSignedUrl(storagePath: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(productImageBucket)
    .createSignedUrl(storagePath, 60 * 30);

  if (error) {
    return null;
  }

  return data.signedUrl;
}
