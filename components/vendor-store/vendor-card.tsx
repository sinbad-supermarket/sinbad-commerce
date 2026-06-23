import Link from "next/link";
import type { PublicVendor } from "@/features/public-vendors/types";

type VendorCardProps = {
  vendor: PublicVendor;
};

export function VendorCard({ vendor }: VendorCardProps) {
  return (
    <article className="vendor-card">
      <div className="vendor-card-logo" aria-hidden="true">
        {vendor.name_en.slice(0, 1).toUpperCase()}
      </div>
      <div className="vendor-card-body">
        <Link href={`/store/${vendor.slug}`}>
          <h2>{vendor.name_en}</h2>
        </Link>
        {vendor.name_ar ? (
          <p className="arabic-text" dir="rtl">
            {vendor.name_ar}
          </p>
        ) : null}
        {vendor.description_en ? <p>{vendor.description_en}</p> : null}
        {vendor.description_ar ? (
          <p className="arabic-text" dir="rtl">
            {vendor.description_ar}
          </p>
        ) : null}
        <Link className="muted-link" href={`/store/${vendor.slug}`}>
          /store/{vendor.slug}
        </Link>
      </div>
    </article>
  );
}
