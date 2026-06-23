import { orderStatuses, type OrderStatus } from "@/features/orders/types";

type OrderStatusFormProps = {
  action: (formData: FormData) => void;
  currentStatus: OrderStatus;
  label: string;
  fieldName: string;
};

function statusLabel(status: OrderStatus) {
  return status.replaceAll("_", " ");
}

export function OrderStatusForm({
  action,
  currentStatus,
  label,
  fieldName,
}: OrderStatusFormProps) {
  return (
    <form className="inline-status-form" action={action}>
      <label className="field compact-status-field">
        <span>{label}</span>
        <select name={fieldName} defaultValue={currentStatus}>
          {orderStatuses.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
      </label>
      <button className="secondary-button" type="submit">
        Update
      </button>
    </form>
  );
}
