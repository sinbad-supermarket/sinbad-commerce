import "server-only";

import { randomUUID } from "node:crypto";
import {
  extensionForMimeType,
  getProductImageDimensions,
  optionalImageText,
  parseImageSortOrder,
  productImageBucket,
  validateProductImageFile,
} from "@/features/product-images/validators";
import { requireSelectedVendor } from "@/lib/auth/require-vendor";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createStagedSubmissionImageSignedItems } from "./images";
import { getVendorSubmissionById } from "./queries";
import { editableSubmissionStatuses } from "./types";
import type {
  ProductReviewSubmissionRow,
  ProductSubmissionSnapshot,
  StagedSubmissionImageListItem,
} from "./types";

type ImageRole = "primary" | "additional";

function assertVendorCanWrite(status: string) {
  if (status === "suspended") {
    throw new Error("This vendor account is suspended. Product submissions are read-only.");
  }
}

async function getCurrentUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You must be signed in to manage product images.");
  }

  return user.id;
}

function assertOwnEditableSubmission(
  submission: ProductReviewSubmissionRow,
  userId: string,
) {
  if (submission.submitted_by !== userId) {
    throw new Error("Only the original submitter can edit this submission.");
  }

  if (
    !editableSubmissionStatuses.includes(
      submission.status as (typeof editableSubmissionStatuses)[number],
    )
  ) {
    throw new Error("This submission can no longer be edited.");
  }
}

async function updateSubmissionSnapshot(
  submissionId: string,
  vendorId: string,
  snapshot: ProductSubmissionSnapshot,
) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("product_review_submissions")
    .update({ snapshot })
    .eq("id", submissionId)
    .eq("vendor_id", vendorId);

  if (error) {
    throw new Error(error.message);
  }
}

async function getOwnEditableSubmission(submissionId: string) {
  const { currentVendor } = await requireSelectedVendor();
  assertVendorCanWrite(currentVendor.vendor.status);

  const userId = await getCurrentUserId();
  const submission = await getVendorSubmissionById(
    submissionId,
    currentVendor.vendor.id,
  );

  if (!submission) {
    throw new Error("Submission was not found.");
  }

  assertOwnEditableSubmission(submission, userId);

  return { currentVendor, submission };
}

function parseImageRole(value: FormDataEntryValue | null): ImageRole {
  return value === "primary" ? "primary" : "additional";
}

export async function uploadSubmissionImageAsync(
  submissionId: string,
  formData: FormData,
): Promise<StagedSubmissionImageListItem[]> {
  let storagePath: string | null = null;
  let replacedPrimaryStoragePath: string | null = null;

  try {
    const { currentVendor, submission } = await getOwnEditableSubmission(submissionId);
    const file = validateProductImageFile(formData.get("image"));
    const imageRole = parseImageRole(formData.get("image_role"));
    const replacingPrimaryImage = submission.snapshot.images.find((image) => image.is_primary);
    const imageCountAfterUpload =
      imageRole === "primary" && replacingPrimaryImage
        ? submission.snapshot.images.length
        : submission.snapshot.images.length + 1;

    if (imageCountAfterUpload > 8) {
      throw new Error("You can upload up to 8 images total.");
    }

    const dimensions = await getProductImageDimensions(file);
    const imageId = randomUUID();
    const extension = extensionForMimeType(file.type);
    storagePath = `vendor-submissions/${currentVendor.vendor.id}/${submission.id}/${imageId}.${extension}`;
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

    const remainingImages =
      imageRole === "primary"
        ? submission.snapshot.images.filter((image) => {
            if (!image.is_primary) {
              return true;
            }

            replacedPrimaryStoragePath = image.storage_path;
            return false;
          })
        : submission.snapshot.images;
    const nextAdditionalSortOrder =
      remainingImages
        .filter((image) => !image.is_primary)
        .reduce((max, image) => Math.max(max, image.sort_order), 0) + 1;
    const nextImages = [
      ...remainingImages.map((image) => ({
        ...image,
        is_primary: imageRole === "primary" ? false : image.is_primary,
      })),
      {
        id: imageId,
        storage_path: storagePath,
        alt_text_en: optionalImageText(formData.get("alt_text_en")),
        alt_text_ar: optionalImageText(formData.get("alt_text_ar")),
        sort_order:
          formData.get("sort_order") === null
            ? imageRole === "primary"
              ? 0
              : nextAdditionalSortOrder
            : parseImageSortOrder(formData.get("sort_order")),
        is_primary: imageRole === "primary",
        file_size: file.size,
        mime_type: file.type,
        width: dimensions.width,
        height: dimensions.height,
      },
    ];

    await updateSubmissionSnapshot(submission.id, currentVendor.vendor.id, {
      ...submission.snapshot,
      images: nextImages,
    });

    if (replacedPrimaryStoragePath) {
      await supabase.storage.from(productImageBucket).remove([replacedPrimaryStoragePath]);
    }

    return createStagedSubmissionImageSignedItems(nextImages);
  } catch (error) {
    if (storagePath) {
      const supabase = await createSupabaseServerClient();
      await supabase.storage.from(productImageBucket).remove([storagePath]);
    }

    throw error;
  }
}

export async function deleteSubmissionImageAsync(
  submissionId: string,
  imageId: string,
): Promise<StagedSubmissionImageListItem[]> {
  const { currentVendor, submission } = await getOwnEditableSubmission(submissionId);
  const image = submission.snapshot.images.find((item) => item.id === imageId);

  if (!image) {
    throw new Error("Image was not found.");
  }

  const supabase = await createSupabaseServerClient();
  const { error: storageError } = await supabase.storage
    .from(productImageBucket)
    .remove([image.storage_path]);

  if (storageError) {
    throw new Error(storageError.message);
  }

  const nextImages = submission.snapshot.images.filter((item) => item.id !== imageId);

  await updateSubmissionSnapshot(submission.id, currentVendor.vendor.id, {
    ...submission.snapshot,
    images: nextImages,
  });

  return createStagedSubmissionImageSignedItems(nextImages);
}
