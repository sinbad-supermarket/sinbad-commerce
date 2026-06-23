import { orderStatuses, type OrderStatus } from "./types";

export function parseOrderStatus(value: FormDataEntryValue | string | null): OrderStatus {
  const status = String(value ?? "").trim();

  if (!orderStatuses.includes(status as OrderStatus)) {
    throw new Error("Order status is invalid.");
  }

  return status as OrderStatus;
}
