import PagePagination from "src/components/core/PagePagination";

type PaginationProps = {
  totalPages: number;
};

export default function OpportunitiesPagination({
  totalPages,
}: PaginationProps) {
  return <PagePagination totalPages={totalPages} />;
}
