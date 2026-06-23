import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/product-card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Pagination } from "@/components/ui/pagination";
import { parsePage } from "@/features/public-catalog/pagination";
import {
  getPublicCategoryBySlug,
  listPublicProductsByCategory,
} from "@/features/public-catalog/queries";

export const dynamic = "force-dynamic";

type CategoryDetailParams = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

export async function generateMetadata({
  params,
}: CategoryDetailParams): Promise<Metadata> {
  const { slug } = await params;
  const category = await getPublicCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Category not found | Sinbad Commerce Lab",
    };
  }

  return {
    title: `${category.name_en} | Sinbad Commerce Lab`,
    description: category.description_en ?? category.name_en,
  };
}

export default async function CategoryDetailPage({
  params,
  searchParams,
}: CategoryDetailParams) {
  const [{ slug }, { page }] = await Promise.all([params, searchParams]);
  const category = await getPublicCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const currentPage = parsePage(page);
  const productPage = await listPublicProductsByCategory(category.id, currentPage);

  return (
    <>
      <Breadcrumbs
        items={[
          { href: "/", label: "Home" },
          { label: category.name_en },
        ]}
      />
      <h1 className="page-title">{category.name_en}</h1>
      <p className="arabic-text" dir="rtl">
        {category.name_ar}
      </p>
      {category.description_en ? <p className="page-copy">{category.description_en}</p> : null}
      {category.description_ar ? (
        <p className="arabic-text" dir="rtl">
          {category.description_ar}
        </p>
      ) : null}

      <section className="public-section">
        {productPage.products.length === 0 ? (
          <p className="empty-state">No active products are available in this category yet.</p>
        ) : (
          <div className="product-grid">
            {productPage.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <Pagination
        basePath={`/categories/${category.slug}`}
        currentPage={productPage.currentPage}
        hasNextPage={productPage.hasNextPage}
        hasPreviousPage={productPage.hasPreviousPage}
      />
    </>
  );
}
