import { UnauthorizedError } from "src/errors";
import { logger } from "src/services/logger/simplerLogger";

import { getTranslations } from "next-intl/server";
import { ReactNode, Suspense } from "react";

import { TableCellData } from "src/components/core/TableWithResponsiveHeader";
import { PaginatedTableSkeleton } from "./PaginatedTableSkeleton";
import {
  PaginatedTableFetcher,
  PaginatedTableFetchResult,
  PaginatedTablePaginationInfo,
} from "./paginatedTableTypes";
import { fetchPageWithLastPageFallback } from "./paginatedTableUtils";
import {
  PaginatedTableErrorMessage,
  PaginatedTableView,
} from "./PaginatedTableView";

export type PaginatedTableProps<T> = {
  // fetches one page of data, sort order is fixed within the fetcher
  fetchPage: PaginatedTableFetcher<T>;
  // page to start on, generally parsed from the `page` search param with `parsePageParam`
  page: number;
  // column titles
  headerContent: TableCellData[];
  // maps a single record to the cells for its row (same length and order as headerContent)
  mapRowData: (item: T, index: number) => TableCellData[];
  // optional stable key for each row
  getRowKey?: (item: T) => string;
  // displayed in place of the table if data can't be fetched
  errorMessage: ReactNode;
  // displayed in place of the table if the data set is empty
  emptyMessage?: ReactNode;
  // optional content above the table, receives the API's pagination info (ex. total count)
  renderSummary?: (paginationInfo: PaginatedTablePaginationInfo) => ReactNode;
};

// Data fetching portion of the paginated table. Exported for testing; use PaginatedTable.
export async function ResolvedPaginatedTable<T>({
  fetchPage,
  page,
  headerContent,
  mapRowData,
  getRowKey,
  errorMessage,
  emptyMessage = null,
  renderSummary,
}: PaginatedTableProps<T>) {
  let result: PaginatedTableFetchResult<T>;
  try {
    result = await fetchPageWithLastPageFallback(fetchPage, page);
  } catch (e) {
    // permission gating happens at the page level, let auth errors continue up the stack
    if (e instanceof UnauthorizedError) {
      throw e;
    }
    logger.error({ err: e }, "Unable to fetch data for paginated table");
    return <PaginatedTableErrorMessage message={errorMessage} />;
  }

  const { response, page: resolvedPage, requestedPage } = result;

  if (!response.data?.length) {
    return <>{emptyMessage}</>;
  }

  const t = await getTranslations("PaginatedTable");

  return (
    <PaginatedTableView
      page={resolvedPage}
      totalPages={Math.max(response.pagination_info.total_pages, 1)}
      headerContent={headerContent}
      tableRowData={response.data.map(mapRowData)}
      rowKeys={getRowKey ? response.data.map(getRowKey) : undefined}
      summary={renderSummary?.(response.pagination_info)}
      lastPageMessage={requestedPage ? t("lastPageNotice") : undefined}
    />
  );
}

// General use table + USWDS pagination + data fetching.
// Constraints (see https://github.com/HHS/simpler-grants-gov/issues/8011):
// - fixed sort order, no client side filtering
// - one paginated table per page, as the page number lives in the `page` search param
// - permission gating is handled by the page, not the table
export function PaginatedTable<T>(props: PaginatedTableProps<T>) {
  return (
    <Suspense fallback={<PaginatedTableSkeleton />}>
      <ResolvedPaginatedTable {...props} />
    </Suspense>
  );
}
