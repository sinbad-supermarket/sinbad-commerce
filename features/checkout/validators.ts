import type { CheckoutFormValues } from "./types";

function requiredText(value: FormDataEntryValue | null, label: string, maxLength: number) {
  const text = String(value ?? "").trim();

  if (!text) {
    throw new Error(`${label} is required.`);
  }

  if (text.length > maxLength) {
    throw new Error(`${label} is too long.`);
  }

  return text;
}

function optionalText(value: FormDataEntryValue | null, label: string, maxLength: number) {
  const text = String(value ?? "").trim();

  if (!text) {
    return null;
  }

  if (text.length > maxLength) {
    throw new Error(`${label} is too long.`);
  }

  return text;
}

export function parseCheckoutForm(formData: FormData): CheckoutFormValues {
  const customerEmail = optionalText(formData.get("customer_email"), "Email", 254);

  if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    throw new Error("Email is invalid.");
  }

  return {
    customerName: requiredText(formData.get("customer_name"), "Customer name", 120),
    customerPhone: requiredText(formData.get("customer_phone"), "Phone", 40),
    customerEmail,
    deliveryArea: requiredText(formData.get("delivery_area"), "Delivery area", 120),
    deliveryAddress: requiredText(formData.get("delivery_address"), "Delivery address", 500),
    deliveryNotes: optionalText(formData.get("delivery_notes"), "Delivery notes", 500),
  };
}

export function parseOrderNumber(value: string) {
  const orderNumber = value.trim().toUpperCase();

  if (!/^SCL-[A-F0-9]{12}$/.test(orderNumber)) {
    return null;
  }

  return orderNumber;
}

export function parseConfirmationToken(value: string | undefined) {
  const token = String(value ?? "").trim();

  if (!/^[a-f0-9]{64}$/.test(token)) {
    return null;
  }

  return token;
}
