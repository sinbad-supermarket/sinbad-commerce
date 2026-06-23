import { VendorAccountSelector } from "@/components/vendor/vendor-account-selector";
import { requireVendorMemberships } from "@/lib/auth/require-vendor";
import { selectVendorAccount } from "./actions";

export default async function VendorSelectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [memberships, { error }] = await Promise.all([
    requireVendorMemberships(),
    searchParams,
  ]);

  return (
    <main className="shell">
      <div className="page-header">
        <div>
          <h1 className="page-title">Select Vendor</h1>
          <p className="page-copy">Choose which vendor account to manage.</p>
        </div>
      </div>

      {error === "invalid" ? (
        <p className="form-error">You cannot access the selected vendor.</p>
      ) : null}

      <VendorAccountSelector
        action={selectVendorAccount}
        memberships={memberships}
      />
    </main>
  );
}
