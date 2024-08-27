"use client";
import { Pagination } from "@trussworks/react-uswds";
import { QueryContext } from "src/app/[locale]/search/QueryProvider";
import { useContext } from "react";
import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";

export enum PaginationPosition {
  Top = "topPagination",
  Bottom = "bottomPagination",
}

interface SearchPaginationProps {
  page: number;
  query: string | null | undefined;
  total?: number | null;
  scroll?: boolean;
  totalResults?: string;
  loading?: boolean;
}

const MAX_SLOTS = 7;

export default function SearchPagination({
  page,
  query,
  total = null,
  scroll = false,
  totalResults = "",
  loading = false,
}: SearchPaginationProps) {
  const { updateQueryParams } = useSearchParamUpdater();
  const { updateTotalPages, updateTotalResults } = useContext(QueryContext);
  const { totalPages } = useContext(QueryContext);
  // Shows total pages from the query context before it is re-fetched from the API.
  const pages = total || Number(totalPages);

  const updatePage = (page: number) => {
    updateTotalPages(String(total));
    updateTotalResults(totalResults);
    updateQueryParams(String(page), "page", query, scroll);
  };

  return (
    <div className={`grants-pagination ${loading ? "disabled" : ""}`}>
      {pages > 0 && (
        <Pagination
          pathname="/search"
          totalPages={pages}
          currentPage={page}
          maxSlots={MAX_SLOTS}
          onClickNext={() => updatePage(page + 1)}
          onClickPrevious={() => updatePage(page > 1 ? page - 1 : 0)}
          onClickPageNumber={(event: React.MouseEvent, page: number) =>
            updatePage(page)
          }
        />
      )}
    </div>
  );
}
