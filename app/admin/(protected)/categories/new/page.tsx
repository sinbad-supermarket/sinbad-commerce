import Link from "next/link";
import { CategoryForm } from "@/components/admin/category-form";
import { createCategory } from "@/features/categories/actions";
import { listParentCategoryOptions } from "@/features/categories/queries";

export default async function NewCategoryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [parentOptions, { error }] = await Promise.all([
    listParentCategoryOptions(),
    searchParams,
  ]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">New Category</h1>
          <p className="page-copy">Create a bilingual category.</p>
        </div>
        <Link className="secondary-link" href="/admin/categories">
          Back to categories
        </Link>
      </div>

      <CategoryForm
        action={createCategory}
        error={error}
        parentOptions={parentOptions}
        submitLabel="Create category"
      />
    </>
  );
}
