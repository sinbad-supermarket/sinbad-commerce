import type { CurrentVendorMembership } from "@/lib/auth/vendor";

type VendorAccountSelectorProps = {
  action: (formData: FormData) => void | Promise<void>;
  memberships: CurrentVendorMembership[];
};

export function VendorAccountSelector({
  action,
  memberships,
}: VendorAccountSelectorProps) {
  return (
    <form className="admin-form" action={action}>
      <label className="field">
        <span>Vendor account</span>
        <select name="vendor_id" required>
          {memberships.map((membership) => (
            <option key={membership.vendor.id} value={membership.vendor.id}>
              {membership.vendor.nameEn} ({membership.role}, {membership.vendor.status})
            </option>
          ))}
        </select>
      </label>

      <button className="primary-button" type="submit">
        Continue
      </button>
    </form>
  );
}
