"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminProductById } from "@/features/products/queries";
import {
  countProductImages,
  getProductImageById,
} from "./queries";
import {
  extensionForMimeType,
  optionalImageText,
  parseImageSortOrder,
  productImageBucket,
  validateProductImageFile,
} from "./validators";

function imageErrorRedirect(productId: string, message: string): never {
  redirect(`/admin/products/${productId}/images?error=${encodeURIComponent(message)}`);
}

async function assertProductExists(productId: string) {
  const product = await getAdminProductById(productId);

  if (!product) {
    throw new Error("Product does not exist.");
  }

  return product;
}

async function setPrimaryImage(productId: string, imageId: string) {
  const supabase = await createSupabaseServerClient();
  const { error: clearError } = await supabase
    .from("product_images")
    .update({ is_primary: false })
    .eq("product_id", productId)
    .neq("id", imageId);

  if (clearError) {
    throw new Error(clearError.message);
  }

  const { error: setError } = await supabase
    .from("product_images")
    .update({ is_primary: true })
    .eq("id", imageId)
    .eq("product_id", productId);

  if (setError) {
    throw new Error(setError.message);
  }
}

export async function uploadProductImage(productId: string, formData: FormData) {
  await requireAdmin();

  try {
    await assertProductExists(productId);

    const file = validateProductImageFile(formData.get("image"));
    const imageId = randomUUID();
    const extension = extensionForMimeType(file.type);
    const storagePath = `products/${productId}/${imageId}.${extension}`;
    const existingImageCount = await countProductImages(productId);
    const supabase = await createSupabaseServerClient();
    const { error: uploadError } = await supabase.storage
      .from(productImageBucket)
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { error: insertError } = await supabase.from("product_images").insert({
      id: imageId,
      product_id: productId,
      storage_path: storagePath,
      alt_text_en: optionalImageText(formData.get("alt_text_en")),
      alt_text_ar: optionalImageText(formData.get("alt_text_ar")),
      sort_order: parseImageSortOrder(formData.get("sort_order")),
      is_primary: existingImageCount === 0,
      file_size: file.size,
      mime_type: file.type,
    });

    if (insertError) {
      await supabase.storage.from(productImageBucket).remove([storagePath]);
      throw new Error(insertError.message);
    }
  } catch (error) {
    imageErrorRedirect(
      productId,
      error instanceof Error ? error.message : "Unable to upload image.",
    );
  }

  redirect(`/admin/products/${productId}/images`);
}

export async function updateProductImage(
  productId: string,
  imageId: string,
  formData: FormData,
) {
  await requireAdmin();

  try {
    await assertProductExists(productId);

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("product_images")
      .update({
        alt_text_en: optionalImageText(formData.get("alt_text_en")),
        alt_text_ar: optionalImageText(formData.get("alt_text_ar")),
        sort_order: parseImageSortOrder(formData.get("sort_order")),
      })
      .eq("id", imageId)
      .eq("product_id", productId);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    imageErrorRedirect(
      productId,
      error instanceof Error ? error.message : "Unable to update image.",
    );
  }

  redirect(`/admin/products/${productId}/images`);
}

export async function makeProductImagePrimary(productId: string, imageId: string) {
  await requireAdmin();

  try {
    const image = await getProductImageById(imageId);

    if (!image || image.product_id !== productId) {
      throw new Error("Image does not exist.");
    }

    await setPrimaryImage(productId, imageId);
  } catch (error) {
    imageErrorRedirect(
      productId,
      error instanceof Error ? error.message : "Unable to set primary image.",
    );
  }

  redirect(`/admin/products/${productId}/images`);
}

export async function deleteProductImage(productId: string, imageId: string) {
  await requireAdmin();

  try {
    const image = await getProductImageById(imageId);

    if (!image || image.product_id !== productId) {
      throw new Error("Image does not exist.");
    }

    const supabase = await createSupabaseServerClient();
    const { error: storageError } = await supabase.storage
      .from(productImageBucket)
      .remove([image.storage_path]);

    if (storageError) {
      throw new Error(storageError.message);
    }

    const { error: deleteError } = await supabase
      .from("product_images")
      .delete()
      .eq("id", imageId)
      .eq("product_id", productId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }
  } catch (error) {
    imageErrorRedirect(
      productId,
      error instanceof Error ? error.message : "Unable to delete image.",
    );
  }

  redirect(`/admin/products/${productId}/images`);
}
