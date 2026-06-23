import type { Metadata } from "next";
import { VendorCard } from "@/components/vendor-store/vendor-card";
import { listPublicVendors } from "@/features/public-vendors/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stores | Sinbad Commerce Lab",
  description: "Browse public vendor stores in Sinbad Commerce Lab.",
  alternates: {
    canonical: "/store",
  },
  openGraph: {
    title: "Stores | Sinbad Commerce Lab",
    description: "Browse public vendor stores in Sinbad Commerce Lab.",
    url: "/store",
    type: "website",
  },
};

export default async function StoreListingPage() {
  const vendors = await listPublicVendors();

  return (
    <>
      <h1 className="page-title">Stores</h1>
      <p className="page-copy">Public vendor stores with approved active products.</p>

      {vendors.length === 0 ? (
        <p className="empty-state">No public vendor stores are available yet.</p>
      ) : (
        <div className="vendor-grid">
          {vendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </div>
      )}
    </>
  );
}
