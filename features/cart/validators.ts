export function parseCartQuantity(value: FormDataEntryValue | null) {
  const quantityText = String(value ?? "1").trim();

  if (!/^\d+$/.test(quantityText)) {
    throw new Error("Quantity must be a whole number.");
  }

  const quantity = Number(quantityText);

  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    throw new Error("Quantity must be at least 1.");
  }

  if (quantity > 99) {
    throw new Error("Quantity cannot exceed 99.");
  }

  return quantity;
}

export function parseRequiredUuid(value: FormDataEntryValue | string | null, label: string) {
  const id = String(value ?? "").trim();

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id)) {
    throw new Error(`${label} is invalid.`);
  }

  return id;
}
