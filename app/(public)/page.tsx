import { CategoryList } from "@/components/category/category-list";
import { ProductCard } from "@/components/product/product-card";
import {
  listLatestPublicProducts,
  listPublicCategories,
} from "@/features/public-catalog/queries";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return <HomePageContent />;
}

async function HomePageContent() {
  const [categories, products] = await Promise.all([
    listPublicCategories(),
    listLatestPublicProducts(8),
  ]);

  return (
    <>
      <h1 className="page-title">Sinbad Commerce Lab</h1>
      <p className="page-copy">
        Browse active bilingual catalog products and categories.
      </p>

      <section className="public-section">
        <div className="section-heading">
          <h2>Categories</h2>
        </div>
        <CategoryList categories={categories} />
      </section>

      <section className="public-section">
        <div className="section-heading">
          <h2>Latest products</h2>
        </div>
        {products.length === 0 ? (
          <p className="empty-state">No active products are available yet.</p>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
