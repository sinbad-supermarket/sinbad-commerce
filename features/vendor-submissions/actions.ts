"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import {
  extensionForMimeType,
  getProductImageDimensions,
  optionalImageText,
  parseImageSortOrder,
  productImageBucket,
  validateProductImageFile,
} from "@/features/product-images/validators";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireSelectedVendor } from "@/lib/auth/require-vendor";
import type { ProductStatus } from "@/features/products/types";
import {
  activeUpdateSubmissionStatuses,
  type ProductAvailability,
  type ProductCondition,
  type ProductReviewSubmissionRow,
  type ProductSubmissionSnapshot,
} from "./types";
import {
  assertSnapshotReadyForReview,
  assertSubmissionIsEditable,
  parseSubmissionSnapshotFormData,
} from "./validators";
import {
  getVendorCanonicalProductById,
  getVendorSubmissionById,
  listVendorProductCategoryAssignments,
} from "./queries";

function submissionErrorRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

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
    throw new Error("You must be signed in to manage product submissions.");
  }

  return user.id;
}

async function assertCategoriesExist(categoryIds: string[]) {
  if (categoryIds.length === 0) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id")
    .eq("is_active", true)
    .in("id", categoryIds);

  if (error) {
    throw new Error(error.message);
  }

  if ((data ?? []).length !== categoryIds.length) {
    throw new Error("One or more selected categories are unavailable.");
  }
}

async function assertCanonicalFieldIsAvailable(
  field: "slug" | "sku" | "barcode",
  value: string | null,
  currentProductId?: string | null,
) {
  if (!value) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    "is_canonical_product_field_available",
    {
      p_field: field,
      p_value: value,
      p_exclude_product_id: currentProductId ?? null,
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(`${field === "slug" ? "Slug" : field.toUpperCase()} is already in use.`);
  }
}

async function assertSnapshotIsAvailable(
  snapshot: ProductSubmissionSnapshot,
  currentProductId?: string | null,
) {
  await assertCanonicalFieldIsAvailable("slug", snapshot.product.slug, currentProductId);
  await assertCanonicalFieldIsAvailable("sku", snapshot.product.sku, currentProductId);
  await assertCanonicalFieldIsAvailable(
    "barcode",
    snapshot.product.barcode,
    currentProductId,
  );
}

function categoryIdsFromSnapshot(snapshot: ProductSubmissionSnapshot) {
  return snapshot.categories.map((category) => category.category_id);
}

function submissionDetailPath(submissionId: string) {
  return `/vendor/products/submissions/${submissionId}`;
}

function blankSubmissionSnapshot(slug: string): ProductSubmissionSnapshot {
  return {
    version: 1,
    product: {
      slug,
      sku: null,
      barcode: null,
      name_en: "",
      name_ar: "",
      short_description_en: null,
      short_description_ar: null,
      description_en: null,
      description_ar: null,
      price: null,
      sale_price: null,
      brand_name: null,
      video_url: null,
      stock_quantity: null,
      availability: "in_stock",
      product_condition: "new",
      specifications: [],
      warranty: null,
      brand_request: null,
      suggested_category: null,
      intended_status: "active",
    },
    categories: [],
    images: [],
  };
}

function snapshotFromCanonicalProduct(
  product: {
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
    sale_price?: string | number | null;
    brand_name?: string | null;
    video_url?: string | null;
    stock_quantity?: number | null;
    availability?: string | null;
    product_condition?: string | null;
    specifications?: Array<{ key: string; value: string }> | null;
    warranty?: string | null;
    status: string;
  },
  assignments: Array<{ category_id: string; is_primary: boolean }>,
): ProductSubmissionSnapshot {
  return {
    version: 1,
    product: {
      slug: product.slug,
      sku: product.sku,
      barcode: product.barcode,
      name_en: product.name_en,
      name_ar: product.name_ar,
      short_description_en: product.short_description_en,
      short_description_ar: product.short_description_ar,
      description_en: product.description_en,
      description_ar: product.description_ar,
      price:
        product.price === null || product.price === undefined ? null : String(product.price),
      sale_price:
        product.sale_price === null || product.sale_price === undefined
          ? null
          : String(product.sale_price),
      brand_name: product.brand_name ?? null,
      video_url: product.video_url ?? null,
      stock_quantity: product.stock_quantity ?? null,
      availability:
        product.availability === "out_of_stock" || product.availability === "preorder"
          ? product.availability
          : ("in_stock" satisfies ProductAvailability),
      product_condition:
        product.product_condition === "refurbished" || product.product_condition === "used"
          ? product.product_condition
          : ("new" satisfies ProductCondition),
      specifications: product.specifications ?? [],
      warranty: product.warranty ?? null,
      brand_request: null,
      suggested_category: null,
      intended_status: product.status as ProductStatus,
    },
    categories: assignments.map((assignment) => ({
      category_id: assignment.category_id,
      is_primary: assignment.is_primary,
    })),
    images: [],
  };
}

async function assertOwnEditableSubmission(
  submission: ProductReviewSubmissionRow,
  userId: string,
) {
  if (submission.submitted_by !== userId) {
    throw new Error("Only the original submitter can edit this submission.");
  }

  assertSubmissionIsEditable(submission.status);
}

async function getOwnEditableSubmissionForSelectedVendor(submissionId: string) {
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

  await assertOwnEditableSubmission(submission, userId);

  return {
    currentVendor,
    submission,
  };
}

async function updateSubmissionSnapshot(
  submissionId: string,
  vendorId: string,
  snapshot: ProductSubmissionSnapshot,
) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("product_review_submissions")
    .update({
      snapshot,
      status: "draft",
    })
    .eq("id", submissionId)
    .eq("vendor_id", vendorId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function createProductSubmissionDraft(formData: FormData) {
  const { currentVendor } = await requireSelectedVendor();
  let submissionId: string;

  try {
    assertVendorCanWrite(currentVendor.vendor.status);
    const userId = await getCurrentUserId();
    const snapshot = parseSubmissionSnapshotFormData(formData, {
      requireCategories: false,
    });
    await assertCategoriesExist(categoryIdsFromSnapshot(snapshot));
    await assertSnapshotIsAvailable(snapshot);

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("product_review_submissions")
      .insert({
        vendor_id: currentVendor.vendor.id,
        product_id: null,
        submitted_by: userId,
        change_type: "create",
        status: "draft",
        snapshot,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    submissionId = data.id;
  } catch (error) {
    submissionErrorRedirect(
      "/vendor/products/new",
      error instanceof Error ? error.message : "Unable to create submission draft.",
    );
  }

  redirect(`/vendor/products/submissions/${submissionId}`);
}

export async function createBlankProductSubmissionDraft() {
  const { currentVendor } = await requireSelectedVendor();
  let submissionId: string;

  try {
    assertVendorCanWrite(currentVendor.vendor.status);
    const userId = await getCurrentUserId();
    const snapshot = blankSubmissionSnapshot(`draft-${randomUUID()}`);
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("product_review_submissions")
      .insert({
        vendor_id: currentVendor.vendor.id,
        product_id: null,
        submitted_by: userId,
        change_type: "create",
        status: "draft",
        snapshot,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    submissionId = data.id;
  } catch (error) {
    submissionErrorRedirect(
      "/vendor/products",
      error instanceof Error ? error.message : "Unable to create product workspace.",
    );
  }

  redirect(`/vendor/products/submissions/${submissionId}`);
}

export async function updateProductSubmissionDraft(
  submissionId: string,
  formData: FormData,
) {
  const { currentVendor } = await requireSelectedVendor();

  try {
    assertVendorCanWrite(currentVendor.vendor.status);
    const userId = await getCurrentUserId();
    const submission = await getVendorSubmissionById(
      submissionId,
      currentVendor.vendor.id,
    );

    if (!submission) {
      throw new Error("Submission was not found.");
    }

    await assertOwnEditableSubmission(submission, userId);

    const snapshot = parseSubmissionSnapshotFormData(formData, {
      requireCategories: false,
    });
    snapshot.images = submission.snapshot.images;
    await assertCategoriesExist(categoryIdsFromSnapshot(snapshot));
    await assertSnapshotIsAvailable(snapshot, submission.product_id);

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("product_review_submissions")
      .update({
        snapshot,
        status: "draft",
      })
      .eq("id", submissionId)
      .eq("vendor_id", currentVendor.vendor.id);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    submissionErrorRedirect(
      `/vendor/products/submissions/${submissionId}`,
      error instanceof Error ? error.message : "Unable to update submission draft.",
    );
  }

  redirect(`/vendor/products/submissions/${submissionId}`);
}

export async function uploadSubmissionImage(submissionId: string, formData: FormData) {
  let storagePath: string | null = null;
  let replacedPrimaryStoragePath: string | null = null;

  try {
    const { currentVendor, submission } =
      await getOwnEditableSubmissionForSelectedVendor(submissionId);
    const file = validateProductImageFile(formData.get("image"));
    const imageRole = formData.get("image_role") === "primary" ? "primary" : "additional";
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
  } catch (error) {
    if (storagePath) {
      const supabase = await createSupabaseServerClient();
      await supabase.storage.from(productImageBucket).remove([storagePath]);
    }

    submissionErrorRedirect(
      submissionDetailPath(submissionId),
      error instanceof Error ? error.message : "Unable to upload image.",
    );
  }

  redirect(submissionDetailPath(submissionId));
}

export async function updateSubmissionImage(
  submissionId: string,
  imageId: string,
  formData: FormData,
) {
  try {
    const { currentVendor, submission } =
      await getOwnEditableSubmissionForSelectedVendor(submissionId);
    let foundImage = false;
    const nextImages = submission.snapshot.images.map((image) => {
      if (image.id !== imageId) {
        return image;
      }

      foundImage = true;
      return {
        ...image,
        alt_text_en: optionalImageText(formData.get("alt_text_en")),
        alt_text_ar: optionalImageText(formData.get("alt_text_ar")),
        sort_order: parseImageSortOrder(formData.get("sort_order")),
      };
    });

    if (!foundImage) {
      throw new Error("Staged image was not found.");
    }

    await updateSubmissionSnapshot(submission.id, currentVendor.vendor.id, {
      ...submission.snapshot,
      images: nextImages,
    });
  } catch (error) {
    submissionErrorRedirect(
      submissionDetailPath(submissionId),
      error instanceof Error ? error.message : "Unable to update staged image.",
    );
  }

  redirect(submissionDetailPath(submissionId));
}

export async function makeSubmissionImagePrimary(
  submissionId: string,
  imageId: string,
) {
  try {
    const { currentVendor, submission } =
      await getOwnEditableSubmissionForSelectedVendor(submissionId);

    if (!submission.snapshot.images.some((image) => image.id === imageId)) {
      throw new Error("Staged image was not found.");
    }

    await updateSubmissionSnapshot(submission.id, currentVendor.vendor.id, {
      ...submission.snapshot,
      images: submission.snapshot.images.map((image) => ({
        ...image,
        is_primary: image.id === imageId,
      })),
    });
  } catch (error) {
    submissionErrorRedirect(
      submissionDetailPath(submissionId),
      error instanceof Error ? error.message : "Unable to set primary image.",
    );
  }

  redirect(submissionDetailPath(submissionId));
}

export async function deleteSubmissionImage(submissionId: string, imageId: string) {
  try {
    const { currentVendor, submission } =
      await getOwnEditableSubmissionForSelectedVendor(submissionId);
    const image = submission.snapshot.images.find((item) => item.id === imageId);

    if (!image) {
      throw new Error("Staged image was not found.");
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
  } catch (error) {
    submissionErrorRedirect(
      submissionDetailPath(submissionId),
      error instanceof Error ? error.message : "Unable to delete image.",
    );
  }

  redirect(submissionDetailPath(submissionId));
}

export async function submitProductSubmissionForReview(submissionId: string) {
  const { currentVendor } = await requireSelectedVendor();

  try {
    assertVendorCanWrite(currentVendor.vendor.status);
    const userId = await getCurrentUserId();
    const submission = await getVendorSubmissionById(
      submissionId,
      currentVendor.vendor.id,
    );

    if (!submission) {
      throw new Error("Submission was not found.");
    }

    await assertOwnEditableSubmission(submission, userId);

    assertSnapshotReadyForReview(submission.snapshot);
    await assertCategoriesExist(categoryIdsFromSnapshot(submission.snapshot));
    await assertSnapshotIsAvailable(submission.snapshot, submission.product_id);

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("product_review_submissions")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .eq("id", submissionId)
      .eq("vendor_id", currentVendor.vendor.id);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    submissionErrorRedirect(
      `/vendor/products/submissions/${submissionId}`,
      error instanceof Error ? error.message : "Unable to submit for review.",
    );
  }

  redirect("/vendor/products");
}

export async function createUpdateSubmissionFromProduct(productId: string) {
  const { currentVendor } = await requireSelectedVendor();
  let submissionId: string;

  try {
    assertVendorCanWrite(currentVendor.vendor.status);
    const userId = await getCurrentUserId();
    const product = await getVendorCanonicalProductById(
      productId,
      currentVendor.vendor.id,
    );

    if (!product) {
      throw new Error("Product was not found.");
    }

    const supabase = await createSupabaseServerClient();
    const { data: activeSubmissions, error: activeSubmissionError } = await supabase
      .from("product_review_submissions")
      .select("id")
      .eq("vendor_id", currentVendor.vendor.id)
      .eq("product_id", productId)
      .eq("change_type", "update")
      .in("status", [...activeUpdateSubmissionStatuses])
      .limit(1);

    if (activeSubmissionError) {
      throw new Error(activeSubmissionError.message);
    }

    if (activeSubmissions && activeSubmissions.length > 0) {
      throw new Error("This product already has an active update submission.");
    }

    const assignments = await listVendorProductCategoryAssignments(
      productId,
      currentVendor.vendor.id,
    );
    const snapshot = snapshotFromCanonicalProduct(product, assignments);
    const { data, error } = await supabase
      .from("product_review_submissions")
      .insert({
        vendor_id: currentVendor.vendor.id,
        product_id: productId,
        submitted_by: userId,
        change_type: "update",
        status: "draft",
        snapshot,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    submissionId = data.id;
  } catch (error) {
    submissionErrorRedirect(
      "/vendor/products",
      error instanceof Error ? error.message : "Unable to create update submission.",
    );
  }

  redirect(`/vendor/products/submissions/${submissionId}`);
}
