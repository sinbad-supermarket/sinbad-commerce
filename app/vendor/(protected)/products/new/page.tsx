import { redirect } from "next/navigation";
import { createBlankProductSubmissionDraft } from "@/features/vendor-submissions/actions";
import { requireSelectedVendor } from "@/lib/auth/require-vendor";

export default async function NewVendorProductPage() {
  const { currentVendor } = await requireSelectedVendor();

  if (currentVendor.vendor.status === "suspended") {
    redirect("/vendor/products?error=Suspended vendors cannot create product drafts.");
  }

  await createBlankProductSubmissionDraft();

  return null;
}
