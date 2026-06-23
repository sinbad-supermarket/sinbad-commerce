import type { PublicVendor } from "@/features/public-vendors/types";

type VendorProfileProps = {
  vendor: PublicVendor;
};

export function VendorProfile({ vendor }: VendorProfileProps) {
  return (
    <section className="vendor-profile" aria-labelledby="vendor-profile-title">
      <div className="vendor-banner" aria-hidden="true" />
      <div className="vendor-profile-content">
        <div className="vendor-profile-logo" aria-hidden="true">
          {vendor.name_en.slice(0, 1).toUpperCase()}
        </div>
        <div className="vendor-profile-copy">
          <p className="eyebrow">Vendor Store</p>
          <h1 id="vendor-profile-title" className="page-title">
            {vendor.name_en}
          </h1>
          {vendor.name_ar ? (
            <p className="arabic-text" dir="rtl">
              {vendor.name_ar}
            </p>
          ) : null}
          {vendor.description_en ? <p className="page-copy">{vendor.description_en}</p> : null}
          {vendor.description_ar ? (
            <p className="arabic-text" dir="rtl">
              {vendor.description_ar}
            </p>
          ) : null}
          <p className="field-help">/store/{vendor.slug}</p>
        </div>
      </div>
    </section>
  );
}
