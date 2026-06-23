import type { Metadata } from "next";
import { ProductCard } from "@/components/product/product-card";
import { Pagination } from "@/components/ui/pagination";
import { parsePage } from "@/features/public-catalog/pagination";
import { searchPublicProducts } from "@/features/search/queries";
import { parseSearchQuery } from "@/features/search/validators";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search | Sinbad Commerce Lab",
  description: "Search active products in Sinbad Commerce Lab.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[]; q?: string | string[] }>;
}) {
  const { page, q } = await searchParams;
  const query = parseSearchQuery(q);
  const currentPage = parsePage(page);
  const results = await searchPublicProducts(query, currentPage);
  const searchBasePath = `/search?q=${encodeURIComponent(query)}`;

  return (
    <>
      <h1 className="page-title">Search</h1>
      <p className="page-copy">Search active products by name, description, SKU, barcode, or category.</p>

      <form className="search-form" action="/search">
        <label className="field">
          <span>Search products</span>
          <input name="q" defaultValue={query} maxLength={100} />
        </label>
        <input name="page" type="hidden" value="1" />
        <button className="primary-button" type="submit">
          Search
        </button>
      </form>

      {!query ? (
        <p className="empty-state">Enter a search term to find active products.</p>
      ) : results.products.length === 0 ? (
        <p className="empty-state">No active products found for “{query}”.</p>
      ) : (
        <>
          <div className="section-heading">
            <h2>Results for “{query}”</h2>
          </div>
          <div className="product-grid">
            {results.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <Pagination
            basePath={searchBasePath}
            currentPage={results.currentPage}
            hasNextPage={results.hasNextPage}
            hasPreviousPage={results.hasPreviousPage}
          />
        </>
      )}
    </>
  );
}
