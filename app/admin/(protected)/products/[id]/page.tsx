import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { listAdminCategories } from "@/features/categories/queries";
import { updateProduct } from "@/features/products/actions";
import {
  getAdminProductById,
  listProductCategoryAssignments,
} from "@/features/products/queries";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const [product, categories, assignments, { error }] = await Promise.all([
    getAdminProductById(id),
    listAdminCategories(),
    listProductCategoryAssignments(id),
    searchParams,
  ]);

  if (!product) {
    notFound();
  }

  const assignedCategoryIds = assignments.map((assignment) => assignment.category_id);
  const primaryCategoryId =
    assignments.find((assignment) => assignment.is_primary)?.category_id ?? null;
  const updateProductWithId = updateProduct.bind(null, product.id);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Edit Product</h1>
          <p className="page-copy">Update product details and category assignments.</p>
        </div>
        <Link className="secondary-link" href="/admin/products">
          Back to products
        </Link>
        <Link className="secondary-link" href={`/admin/products/${product.id}/images`}>
          Manage images
        </Link>
      </div>

      <ProductForm
        action={updateProductWithId}
        assignedCategoryIds={assignedCategoryIds}
        categories={categories}
        error={error}
        primaryCategoryId={primaryCategoryId}
        product={product}
        submitLabel="Save changes"
      />
    </>
  );
}
