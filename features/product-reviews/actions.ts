"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseRequiredAdminNotes } from "./validators";

function reviewErrorRedirect(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function getCurrentUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You must be signed in to review product submissions.");
  }

  return user.id;
}

async function updateReviewStatus(
  reviewId: string,
  status: "rejected" | "changes_requested",
  adminNotes: string,
) {
  const reviewerId = await getCurrentUserId();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("product_review_submissions")
    .update({
      status,
      admin_notes: adminNotes,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .eq("status", "submitted")
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Only submitted product reviews can be updated.");
  }
}

export async function approveProductReview(reviewId: string) {
  await requireAdmin();

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("approve_product_review_submission", {
      p_submission_id: reviewId,
    });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    reviewErrorRedirect(
      `/admin/product-reviews/${reviewId}`,
      error instanceof Error ? error.message : "Unable to approve product review.",
    );
  }

  redirect("/admin/product-reviews");
}

export async function rejectProductReview(reviewId: string, formData: FormData) {
  await requireAdmin();

  try {
    const adminNotes = parseRequiredAdminNotes(formData);
    await updateReviewStatus(reviewId, "rejected", adminNotes);
  } catch (error) {
    reviewErrorRedirect(
      `/admin/product-reviews/${reviewId}`,
      error instanceof Error ? error.message : "Unable to reject product review.",
    );
  }

  redirect("/admin/product-reviews");
}

export async function requestProductReviewChanges(
  reviewId: string,
  formData: FormData,
) {
  await requireAdmin();

  try {
    const adminNotes = parseRequiredAdminNotes(formData);
    await updateReviewStatus(reviewId, "changes_requested", adminNotes);
  } catch (error) {
    reviewErrorRedirect(
      `/admin/product-reviews/${reviewId}`,
      error instanceof Error ? error.message : "Unable to request changes.",
    );
  }

  redirect("/admin/product-reviews");
}
