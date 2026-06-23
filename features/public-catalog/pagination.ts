export const publicCatalogPageSize = 12;

export function parsePage(value: string | string[] | undefined) {
  const rawPage = Array.isArray(value) ? value[0] : value;
  const page = Number(rawPage ?? "1");

  if (!Number.isInteger(page) || page < 1) {
    return 1;
  }

  return page;
}

export function paginationRange(page: number, pageSize = publicCatalogPageSize) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return { from, to };
}

export function pageInfo(page: number, totalCount: number, pageSize = publicCatalogPageSize) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    currentPage: page,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    totalPages,
  };
}
