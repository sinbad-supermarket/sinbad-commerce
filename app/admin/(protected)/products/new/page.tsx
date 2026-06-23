import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";
import { listAdminCategories } from "@/features/categories/queries";
import { createProduct } from "@/features/products/actions";

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [categories, { error }] = await Promise.all([
    listAdminCategories(),
    searchParams,
  ]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">New Product</h1>
          <p className="page-copy">Create a bilingual product.</p>
        </div>
        <Link className="secondary-link" href="/admin/products">
          Back to products
        </Link>
      </div>

      <ProductForm
        action={createProduct}
        categories={categories}
        error={error}
        submitLabel="Create product"
      />
    </>
  );
}
