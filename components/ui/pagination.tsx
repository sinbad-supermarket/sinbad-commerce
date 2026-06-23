import Link from "next/link";

type PaginationProps = {
  basePath: string;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export function Pagination({
  basePath,
  currentPage,
  hasNextPage,
  hasPreviousPage,
}: PaginationProps) {
  if (!hasPreviousPage && !hasNextPage) {
    return null;
  }

  const separator = basePath.includes("?") ? "&" : "?";
  const pageHref = (page: number) => `${basePath}${separator}page=${page}`;

  return (
    <nav className="pagination" aria-label="Pagination">
      {hasPreviousPage ? (
        <Link href={pageHref(currentPage - 1)}>Previous</Link>
      ) : (
        <span>Previous</span>
      )}
      <span>Page {currentPage}</span>
      {hasNextPage ? (
        <Link href={pageHref(currentPage + 1)}>Next</Link>
      ) : (
        <span>Next</span>
      )}
    </nav>
  );
}
