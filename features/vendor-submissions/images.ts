import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { productImageBucket } from "@/features/product-images/validators";
import type {
  StagedSubmissionImage,
  StagedSubmissionImageListItem,
} from "./types";

export async function createStagedSubmissionImageSignedItems(
  images: StagedSubmissionImage[],
) {
  const supabase = await createSupabaseServerClient();

  return Promise.all(
    [...images]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(async (image): Promise<StagedSubmissionImageListItem> => {
        const { data, error } = await supabase.storage
          .from(productImageBucket)
          .createSignedUrl(image.storage_path, 60 * 30);

        return {
          ...image,
          signedUrl: error ? null : data.signedUrl,
        };
      }),
  );
}
