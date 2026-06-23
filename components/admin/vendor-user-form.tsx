import { vendorUserRoles } from "@/features/vendors/types";

type VendorUserFormProps = {
  action: (formData: FormData) => void | Promise<void>;
};

export function VendorUserForm({ action }: VendorUserFormProps) {
  return (
    <form className="admin-form" action={action}>
      <h2 className="section-title">Assign Vendor User</h2>

      <label className="field">
        <span>Auth user UUID</span>
        <input name="user_id" required />
      </label>

      <div className="form-grid">
        <label className="field">
          <span>Role</span>
          <select name="role" defaultValue="editor">
            {vendorUserRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>

        <label className="checkbox-field">
          <input name="is_active" type="checkbox" defaultChecked />
          <span>Active membership</span>
        </label>
      </div>

      <button className="primary-button" type="submit">
        Assign vendor user
      </button>
    </form>
  );
}
