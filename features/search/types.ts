import type { PaginatedProducts } from "@/features/public-catalog/types";

export type SearchResults = PaginatedProducts & {
  query: string;
};
