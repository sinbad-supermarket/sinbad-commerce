import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryForm } from "@/components/admin/category-form";
import { setCategoryActive, updateCategory } from "@/features/categories/actions";
import {
  getAdminCategoryById,
  listParentCategoryOptions,
} from "@/features/categories/queries";

export default async function EditCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const [category, parentOptions, { error }] = await Promise.all([
    getAdminCategoryById(id),
    listParentCategoryOptions(id),
    searchParams,
  ]);

  if (!category) {
    notFound();
  }

  const updateCategoryWithId = updateCategory.bind(null, category.id);
  const toggleCategoryActive = setCategoryActive.bind(null, category.id, !category.is_active);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Category</h1>
          <p className="page-copy">Update bilingual category details.</p>
        </div>
        <Link className="secondary-link" href="/admin/categories">
          Back to categories
        </Link>
      </div>

      <div className="admin-actions">
        <form action={toggleCategoryActive}>
          <button className="secondary-button" type="submit">
            {category.is_active ? "Deactivate category" : "Activate category"}
          </button>
        </form>
      </div>

      <CategoryForm
        action={updateCategoryWithId}
        category={category}
        error={error}
        parentOptions={parentOptions}
        submitLabel="Save changes"
      />
    </>
  );
}
