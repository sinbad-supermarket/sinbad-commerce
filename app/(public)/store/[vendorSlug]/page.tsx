import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/product-card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Pagination } from "@/components/ui/pagination";
import { VendorProfile } from "@/components/vendor-store/vendor-profile";
import { parsePage } from "@/features/public-catalog/pagination";
import {
  getPublicVendorBySlug,
  listPublicVendorProducts,
} from "@/features/public-vendors/queries";

export const dynamic = "force-dynamic";

type VendorStoreParams = {
  params: Promise<{ vendorSlug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

function vendorDescription(vendor: {
  description_en: string | null;
  description_ar: string | null;
  name_en: string;
}) {
  return vendor.description_en ?? vendor.description_ar ?? `${vendor.name_en} vendor store.`;
}

export async function generateMetadata({
  params,
}: VendorStoreParams): Promise<Metadata> {
  const { vendorSlug } = await params;
  const vendor = await getPublicVendorBySlug(vendorSlug);

  if (!vendor) {
    return {
      title: "Store not found | Sinbad Commerce Lab",
    };
  }

  const description = vendorDescription(vendor);
  const canonical = `/store/${vendor.slug}`;

  return {
    title: `${vendor.name_en} | Sinbad Commerce Lab`,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${vendor.name_en} | Sinbad Commerce Lab`,
      description,
      url: canonical,
      type: "website",
    },
  };
}

export default async function VendorStorePage({
  params,
  searchParams,
}: VendorStoreParams) {
  const [{ vendorSlug }, { page }] = await Promise.all([params, searchParams]);
  const vendor = await getPublicVendorBySlug(vendorSlug);

  if (!vendor) {
    notFound();
  }

  const currentPage = parsePage(page);
  const productPage = await listPublicVendorProducts(vendor.id, currentPage);

  return (
    <>
      <Breadcrumbs
        items={[
          { href: "/", label: "Home" },
          { href: "/store", label: "Stores" },
          { label: vendor.name_en },
        ]}
      />
      <VendorProfile vendor={vendor} />

      <section className="public-section" aria-labelledby="vendor-products-title">
        <div className="section-heading">
          <h2 id="vendor-products-title">Products</h2>
        </div>
        {productPage.products.length === 0 ? (
          <p className="empty-state">No approved active products are available from this vendor yet.</p>
        ) : (
          <div className="product-grid">
            {productPage.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <Pagination
        basePath={`/store/${vendor.slug}`}
        currentPage={productPage.currentPage}
        hasNextPage={productPage.hasNextPage}
        hasPreviousPage={productPage.hasPreviousPage}
      />
    </>
  );
}
