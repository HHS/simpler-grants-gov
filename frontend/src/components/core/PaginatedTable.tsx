"use client";

import clsx from "clsx";
import { useSearchParamUpdater } from "src/hooks/useSearchParamUpdater";

import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";
import { Alert, Pagination } from "@trussworks/react-uswds";

import Spinner from "src/components/core/Spinner";
import {
  TableCellData,
  TableWithResponsiveHeader,
} from "src/components/core/TableWithResponsiveHeader";

export type PaginatedTablePage<RowData> = {
  data: RowData[];
  totalPages: number;
};

export type PaginatedTableFetchFunction<RowData> = (
  page: number,
) => Promise<PaginatedTablePage<RowData>>;

// shown when a requested page no longer exists and the last page is
// displayed instead; wording comes from the ticket requirements
export const LAST_PAGE_MESSAGE =
  "The results have changed since this link was created. You’re now viewing the last available page.";

const MAX_SLOTS = 7;
const PAGE_QUERY_PARAM = "page";

export type PaginatedTableProps<RowData> = {
  // fetches a single page of data; the sort order is fixed and is
  // defined within the fetch function itself
  fetchPage: PaginatedTableFetchFunction<RowData>;
  // column titles, in the format expected by TableWithResponsiveHeader
  headerContent: TableCellData[];
  // maps a single data item to the cells of its table row
  getRowData: (row: RowData) => TableCellData[];
  // stable id for a row, needed when rows can be added, removed, or reordered
  getRowKey?: (row: RowData) => string;
  // page to display when the URL does not specify one; defaults to 1
  initialPage?: number;
  // displayed in place of the table when data fails to load
  errorMessage: ReactNode;
  // displayed in place of the table when no data is returned
  emptyContent?: ReactNode;
  // displayed while the first page of data is loading
  loadingContent?: ReactNode;
  // path used to build pagination links; defaults to the current path
  pathname?: string;
};

// A general use table with pagination, built on TableWithResponsiveHeader.
// The component manages calling the provided fetch function, loading and
// error states, and keeping the current page in the URL query string,
// following the pattern established by SearchResultsView / SearchPagination.
//
// Only one PaginatedTable should be rendered on a page, as the page number
// is stored in the URL. Because the current page is read from the URL, this
// component must be rendered inside a Suspense boundary on pages that use it.
//
// If a page beyond the end of the data is requested (for example from a
// bookmark created when there were more results), the last available page
// is fetched and displayed instead, the URL is updated to match, and
// LAST_PAGE_MESSAGE is shown above the table.
export function PaginatedTable<RowData>({
  fetchPage,
  headerContent,
  getRowData,
  getRowKey,
  initialPage = 1,
  errorMessage,
  emptyContent,
  loadingContent,
  pathname,
}: PaginatedTableProps<RowData>) {
  const { searchParams, setQueryParam } = useSearchParamUpdater();
  const currentPathname = usePathname();

  const fallbackPage =
    Number.isInteger(initialPage) && initialPage > 0 ? initialPage : 1;
  const pageParam = searchParams?.get(PAGE_QUERY_PARAM);
  const parsedPage = pageParam ? Number(pageParam) : NaN;
  const currentPage =
    Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : fallbackPage;

  // the most recent successfully loaded page of data, and the page it
  // belongs to; loading and error states are derived from how this
  // compares to the current page, so no state needs to be reset when a
  // fetch starts
  const [pageData, setPageData] = useState<{
    forPage: number;
    result: PaginatedTablePage<RowData>;
  } | null>(null);
  const [errorForPage, setErrorForPage] = useState<number | null>(null);
  // the page the "last available page" notice applies to, if a request
  // was redirected to the last page; the notice is only shown while the
  // user is still on that page
  const [lastPageNoticePage, setLastPageNoticePage] = useState<number | null>(
    null,
  );

  const hasError = errorForPage === currentPage;
  const isLoading =
    !hasError && (pageData === null || pageData.forPage !== currentPage);

  // keep the latest fetch function in a ref so that a new function identity
  // passed on re-render does not trigger a refetch on its own; fetches are
  // driven by page changes only
  const fetchPageRef = useRef(fetchPage);
  useEffect(() => {
    fetchPageRef.current = fetchPage;
  });
  // identifies the most recent request so that responses arriving out of
  // order can be discarded instead of overwriting newer data
  const latestRequestRef = useRef(0);

  useEffect(() => {
    const requestId = ++latestRequestRef.current;

    const loadPage = async () => {
      try {
        let result = await fetchPageRef.current(currentPage);
        let fetchedPage = currentPage;
        if (result.totalPages > 0 && currentPage > result.totalPages) {
          fetchedPage = result.totalPages;
          result = await fetchPageRef.current(fetchedPage);
        }
        if (requestId !== latestRequestRef.current) {
          return;
        }
        setPageData({ forPage: fetchedPage, result });
        // a successful load clears any error recorded for this page,
        // otherwise a page that failed once would show the error forever
        setErrorForPage((previousErrorPage) =>
          previousErrorPage === currentPage ? null : previousErrorPage,
        );
        if (fetchedPage !== currentPage) {
          setLastPageNoticePage(fetchedPage);
          setQueryParam(PAGE_QUERY_PARAM, String(fetchedPage));
        }
      } catch {
        if (requestId !== latestRequestRef.current) {
          return;
        }
        setErrorForPage(currentPage);
      }
    };

    void loadPage();
    // setQueryParam is intentionally not a dependency: it is recreated on
    // every render by useSearchParamUpdater, and including it would refetch
    // on every render. The copy captured here reads the same URL state that
    // produced currentPage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const updatePage = (newPage: number) => {
    if (
      isLoading ||
      newPage === currentPage ||
      newPage < 1 ||
      (pageData !== null && newPage > pageData.result.totalPages)
    ) {
      return;
    }
    // only clear the notice when one is showing; an unconditional state
    // update here would be a no-op render that can swallow the navigation
    if (lastPageNoticePage !== null) {
      setLastPageNoticePage(null);
    }
    setQueryParam(PAGE_QUERY_PARAM, String(newPage));
  };

  if (hasError) {
    return (
      <Alert type="error" headingLevel="h4">
        {errorMessage}
      </Alert>
    );
  }

  if (!pageData) {
    return (
      <>
        {loadingContent ?? (
          <div role="status" className="display-flex flex-align-center">
            <Spinner className="margin-right-1" />
            Loading the table...
          </div>
        )}
      </>
    );
  }

  const totalPages = pageData.result.totalPages;
  const rows = pageData.result.data;

  if (totalPages === 0) {
    return <>{emptyContent ?? <p>There are no results to display.</p>}</>;
  }

  // while a correction to the last page is in flight the URL can briefly
  // point past the end of the data; clamp what the pagination UI displays
  const paginationCurrentPage = Math.min(currentPage, totalPages);
  const showLastPageNotice =
    lastPageNoticePage !== null && lastPageNoticePage === currentPage;

  return (
    <div aria-busy={isLoading}>
      {showLastPageNotice && (
        <Alert type="info" slim headingLevel="h4" className="margin-bottom-2">
          {LAST_PAGE_MESSAGE}
        </Alert>
      )}
      <TableWithResponsiveHeader
        headerContent={headerContent}
        tableRowData={rows.map(getRowData)}
        rowKeys={getRowKey ? rows.map(getRowKey) : undefined}
      />
      {isLoading && (
        <div role="status" className="display-flex flex-align-center">
          <Spinner className="margin-right-1" />
          Loading the table...
        </div>
      )}
      <Pagination
        className={clsx("grants-pagination", { disabled: isLoading })}
        aria-disabled={isLoading}
        pathname={pathname ?? currentPathname ?? ""}
        totalPages={totalPages}
        currentPage={paginationCurrentPage}
        maxSlots={MAX_SLOTS}
        onClickNext={() => updatePage(paginationCurrentPage + 1)}
        onClickPrevious={() => updatePage(paginationCurrentPage - 1)}
        onClickPageNumber={(_event: React.MouseEvent, page: number) =>
          updatePage(page)
        }
      />
    </div>
  );
}
