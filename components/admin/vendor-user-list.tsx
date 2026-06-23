import { vendorUserRoles, type VendorUserRow } from "@/features/vendors/types";

type VendorUserListProps = {
  users: VendorUserRow[];
  onUpdate: (vendorUserId: string) => (formData: FormData) => void | Promise<void>;
};

export function VendorUserList({ users, onUpdate }: VendorUserListProps) {
  if (users.length === 0) {
    return <p className="empty-state">No users have been assigned to this vendor.</p>;
  }

  return (
    <div className="table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Auth user UUID</th>
            <th>Role</th>
            <th>Status</th>
            <th>Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.user_id}</td>
              <td>
                <form className="table-actions" action={onUpdate(user.id)}>
                  <select name="role" defaultValue={user.role}>
                    {vendorUserRoles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <label className="checkbox-field compact-checkbox">
                    <input
                      name="is_active"
                      type="checkbox"
                      defaultChecked={user.is_active}
                    />
                    <span>Active</span>
                  </label>
                  <button className="secondary-button" type="submit">
                    Save
                  </button>
                </form>
              </td>
              <td>
                <span className={user.is_active ? "status-active" : "status-muted"}>
                  {user.is_active ? "Active" : "Inactive"}
                </span>
              </td>
              <td>{new Date(user.updated_at).toLocaleDateString()}</td>
              <td>No delete</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
