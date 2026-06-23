export const maxSearchQueryLength = 100;

export function parseSearchQuery(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return String(rawValue ?? "").trim().slice(0, maxSearchQueryLength);
}
