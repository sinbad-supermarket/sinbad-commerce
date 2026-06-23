import type { Metadata } from "next";
import { ProductCard } from "@/components/product/product-card";
import { Pagination } from "@/components/ui/pagination";
import { parsePage } from "@/features/public-catalog/pagination";
import { listPublicProducts } from "@/features/public-catalog/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Products | Sinbad Commerce Lab",
  description: "Browse active products in Sinbad Commerce Lab.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { page } = await searchParams;
  const currentPage = parsePage(page);
  const productPage = await listPublicProducts(currentPage);

  return (
    <>
      <h1 className="page-title">Products</h1>
      <p className="page-copy">Active catalog products.</p>

      {productPage.products.length === 0 ? (
        <p className="empty-state">No active products are available yet.</p>
      ) : (
        <div className="product-grid">
          {productPage.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <Pagination
        basePath="/products"
        currentPage={productPage.currentPage}
        hasNextPage={productPage.hasNextPage}
        hasPreviousPage={productPage.hasPreviousPage}
      />
    </>
  );
}
