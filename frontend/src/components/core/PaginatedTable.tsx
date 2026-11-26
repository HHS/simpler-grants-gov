"use client";

import clsx from "clsx";

import { useTranslations } from "next-intl";
import {
  ReadonlyURLSearchParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  MouseEvent,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Alert, Pagination } from "@trussworks/react-uswds";

import Spinner from "src/components/core/Spinner";
import {
  TableCellData,
  TableWithResponsiveHeader,
} from "src/components/core/TableWithResponsiveHeader";

export const MAX_PAGINATION_SLOTS = 7;

export interface PaginatedTablePaginationInfo {
  page_offset: number;
  page_size?: number;
  total_pages: number;
  total_records: number;
}

export interface PaginatedTableResponse<T> {
  data: T[];
  paginationInfo: PaginatedTablePaginationInfo;
}

export interface PaginatedTableProps<T> {
  /**
   * Async function that fetches a 1-indexed page of records.
   * Any fixed sort order and direction should be configured within this fetcher.
   */
  fetchPage: (page: number) => Promise<PaginatedTableResponse<T>>;
  /**
   * Column header definitions passed through to TableWithResponsiveHeader.
   */
  headerContent: TableCellData[];
  /**
   * Maps a single data record into TableWithResponsiveHeader row cells.
   */
  mapRow: (item: T, index: number) => TableCellData[];
  /**
   * Optional stable row key extractor forwarded to TableWithResponsiveHeader.
   */
  getRowKey?: (item: T, index: number) => string;
  /**
   * Custom error message displayed in an error Alert in place of the table on fetch failure.
   */
  errorMessage: ReactNode;
  /**
   * Custom display rendered in place of the table when the data set is empty.
   */
  emptyState: ReactNode;
  /**
   * Optional starting page number when no `page` query parameter is present in the URL.
   * Defaults to 1.
   */
  initialPage?: number;
  /**
   * Optional pre-fetched initial page data (for example, from a Server Component).
   */
  initialData?: PaginatedTableResponse<T>;
  /**
   * Optional summary/header renderer above the table (e.g. total record count).
   */
  renderSummary?: (paginationInfo: PaginatedTablePaginationInfo) => ReactNode;
  /**
   * Optional loading status label. Defaults to i18n `PaginatedTable.loading`.
   */
  loadingMessage?: string;
  /**
   * Optional last-page recovery notice message. Defaults to i18n `PaginatedTable.lastPageNotice`.
   */
  lastPageNoticeMessage?: string;
  /**
   * Sync page changes to the `page` URL query parameter using Next.js navigation.
   * Defaults to true. Only one URL-synced PaginatedTable should be used per page.
   */
  syncUrl?: boolean;
  /**
   * Whether navigating to a new page scrolls to the top of the viewport.
   * Defaults to false.
   */
  scrollOnPageChange?: boolean;
  /**
   * Optional key that, when changed, forces a re-fetch of the current page.
   */
  refreshKey?: string | number;
  /**
   * Optional CSS class applied to the outer container.
   */
  className?: string;
  /**
   * Optional CSS class applied to the USWDS Pagination component.
   */
  paginationClassName?: string;
  /**
   * Optional callback invoked after a page finishes loading successfully.
   */
  onPageDataLoaded?: (response: PaginatedTableResponse<T>) => void;
  /**
   * Optional callback invoked when fetching a page fails.
   */
  onError?: (error: unknown) => void;
}

const normalizePage = (page: number | undefined): number => {
  if (typeof page === "number" && Number.isInteger(page) && page >= 1) {
    return page;
  }
  return 1;
};

/**
 * Parses a URL `page` query parameter into a valid 1-indexed positive integer.
 * Falls back to `fallbackPage` when absent, or 1 when non-numeric / <= 0.
 */
export const parsePageParam = (
  pageParam: string | null | undefined,
  fallbackPage = 1,
): number => {
  if (
    pageParam === null ||
    pageParam === undefined ||
    pageParam.trim() === ""
  ) {
    return normalizePage(fallbackPage);
  }
  const parsed = Number(pageParam);
  if (Number.isInteger(parsed) && parsed >= 1) {
    return parsed;
  }
  return 1;
};

/**
 * Builds a URL for the given pathname and searchParams with `page` set to the requested page,
 * preserving all other existing query parameters.
 */
export const buildPageUrl = (
  pathname: string,
  searchParams: ReadonlyURLSearchParams | URLSearchParams | null | undefined,
  page: number,
): string => {
  const params = new URLSearchParams(searchParams?.toString() ?? "");
  params.set("page", String(normalizePage(page)));
  const queryString = params.toString();
  const basePath = pathname || "/";
  return queryString ? `${basePath}?${queryString}` : basePath;
};

const isOutOfRangePage = (
  requestedPage: number,
  response: PaginatedTableResponse<unknown>,
): boolean => {
  const { total_pages: totalPages, page_offset: pageOffset } =
    response.paginationInfo;
  if (totalPages <= 0) {
    return false;
  }
  if (requestedPage > totalPages) {
    return true;
  }
  return response.data.length === 0 && pageOffset > totalPages;
};

export function PaginatedTable<T>({
  fetchPage,
  headerContent,
  mapRow,
  getRowKey,
  errorMessage,
  emptyState,
  initialPage,
  initialData,
  renderSummary,
  loadingMessage,
  lastPageNoticeMessage,
  syncUrl = true,
  scrollOnPageChange = false,
  refreshKey,
  className,
  paginationClassName,
  onPageDataLoaded,
  onError,
}: PaginatedTableProps<T>) {
  const t = useTranslations("PaginatedTable");
  const router = useRouter();
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();

  const urlPageParam = syncUrl ? searchParams?.get("page") : null;
  const searchParamsString = searchParams?.toString() ?? "";

  const startingPage =
    urlPageParam !== null && urlPageParam !== undefined
      ? parsePageParam(urlPageParam, 1)
      : normalizePage(initialPage);

  const canUseInitialData =
    initialData !== undefined &&
    initialData.paginationInfo.page_offset === startingPage &&
    !isOutOfRangePage(startingPage, initialData);

  const [currentPage, setCurrentPage] = useState<number>(startingPage);
  const [rows, setRows] = useState<T[]>(
    canUseInitialData ? initialData.data : [],
  );
  const [paginationInfo, setPaginationInfo] =
    useState<PaginatedTablePaginationInfo | null>(
      canUseInitialData ? initialData.paginationInfo : null,
    );
  const [isLoading, setIsLoading] = useState<boolean>(!canUseInitialData);
  const [hasLoadedOnce, setHasLoadedOnce] =
    useState<boolean>(canUseInitialData);
  const [hasError, setHasError] = useState<boolean>(false);
  const [showLastPageNotice, setShowLastPageNotice] = useState<boolean>(false);
  const [prevSearchParamsString, setPrevSearchParamsString] =
    useState<string>(searchParamsString);
  const [lastPageRedirectTarget, setLastPageRedirectTarget] = useState<
    number | null
  >(null);

  if (syncUrl && prevSearchParamsString !== searchParamsString) {
    setPrevSearchParamsString(searchParamsString);
    const nextUrlPage = parsePageParam(
      searchParams?.get("page"),
      initialPage ?? 1,
    );
    if (lastPageRedirectTarget === nextUrlPage) {
      setLastPageRedirectTarget(null);
    } else if (nextUrlPage !== currentPage) {
      setShowLastPageNotice(false);
      setCurrentPage(nextUrlPage);
    }
  }

  const isMountedRef = useRef<boolean>(true);
  const requestIdRef = useRef<number>(0);
  const skipNextFetchRef = useRef<boolean>(canUseInitialData);
  const prevRefreshKeyRef = useRef<string | number | undefined>(refreshKey);

  // Keep latest callbacks and navigation helpers in refs so re-renders or
  // unstable references (e.g. inline fetchPage or mocked useRouter) never cause redundant fetches.
  const fetchPageRef = useRef(fetchPage);
  const onPageDataLoadedRef = useRef(onPageDataLoaded);
  const onErrorRef = useRef(onError);
  const searchParamsRef = useRef(searchParams);
  const routerRef = useRef(router);
  const pathnameRef = useRef(pathname);
  const syncUrlRef = useRef(syncUrl);

  useEffect(() => {
    fetchPageRef.current = fetchPage;
    onPageDataLoadedRef.current = onPageDataLoaded;
    onErrorRef.current = onError;
    searchParamsRef.current = searchParams;
    routerRef.current = router;
    pathnameRef.current = pathname;
    syncUrlRef.current = syncUrl;
  });

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadPage = useCallback(async (pageToFetch: number) => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setHasError(false);

    try {
      const response = await fetchPageRef.current(pageToFetch);
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      if (isOutOfRangePage(pageToFetch, response)) {
        const lastPage = response.paginationInfo.total_pages;
        const lastPageResponse = await fetchPageRef.current(lastPage);

        if (!isMountedRef.current || requestId !== requestIdRef.current) {
          return;
        }

        setRows(lastPageResponse.data);
        setPaginationInfo(lastPageResponse.paginationInfo);
        setShowLastPageNotice(true);
        setHasLoadedOnce(true);
        setHasError(false);
        setIsLoading(false);

        if (lastPage !== pageToFetch) {
          skipNextFetchRef.current = true;
          setCurrentPage(lastPage);
        }

        if (syncUrlRef.current) {
          setLastPageRedirectTarget(lastPage);
          routerRef.current.replace(
            buildPageUrl(
              pathnameRef.current,
              searchParamsRef.current,
              lastPage,
            ),
            { scroll: false },
          );
        }

        onPageDataLoadedRef.current?.(lastPageResponse);
        return;
      }

      setRows(response.data);
      setPaginationInfo(response.paginationInfo);
      setHasLoadedOnce(true);
      setHasError(false);
      setIsLoading(false);
      onPageDataLoadedRef.current?.(response);
    } catch (error) {
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        return;
      }
      console.error("Failed to fetch paginated table data", error);
      setHasError(true);
      setHasLoadedOnce(true);
      setIsLoading(false);
      onErrorRef.current?.(error);
    }
  }, []);

  useEffect(() => {
    const refreshKeyChanged = prevRefreshKeyRef.current !== refreshKey;
    prevRefreshKeyRef.current = refreshKey;

    if (skipNextFetchRef.current && !refreshKeyChanged) {
      skipNextFetchRef.current = false;
      return;
    }
    skipNextFetchRef.current = false;

    void loadPage(currentPage);
  }, [currentPage, refreshKey, loadPage]);

  const totalPages = paginationInfo?.total_pages ?? 0;

  const handlePageChange = (targetPage: number) => {
    if (isLoading) {
      return;
    }
    if (
      !Number.isInteger(targetPage) ||
      targetPage < 1 ||
      targetPage === currentPage ||
      (totalPages > 0 && targetPage > totalPages)
    ) {
      return;
    }

    setShowLastPageNotice(false);
    setCurrentPage(targetPage);

    if (syncUrl) {
      router.push(buildPageUrl(pathname, searchParams, targetPage), {
        scroll: scrollOnPageChange,
      });
    }
  };

  const resolvedLoadingMessage = loadingMessage ?? t("loading");
  const resolvedLastPageNotice = lastPageNoticeMessage ?? t("lastPageNotice");

  if (isLoading && !hasLoadedOnce) {
    return (
      <div
        className={clsx(
          "display-flex flex-align-center padding-y-4",
          className,
        )}
        role="status"
        aria-live="polite"
        aria-busy="true"
        data-testid="paginated-table-loading"
      >
        <Spinner className="margin-right-2" />
        <span>{resolvedLoadingMessage}</span>
      </div>
    );
  }

  if (hasError && !isLoading) {
    return (
      <div className={className} data-testid="paginated-table-error">
        <Alert type="error" headingLevel="h4" noIcon role="alert">
          {errorMessage}
        </Alert>
      </div>
    );
  }

  if (!isLoading && hasLoadedOnce && rows.length === 0) {
    return (
      <div className={className} data-testid="paginated-table-empty">
        {emptyState}
      </div>
    );
  }

  const tableRowData = rows.map((item, index) => mapRow(item, index));
  const rowKeys = getRowKey
    ? rows.map((item, index) => getRowKey(item, index))
    : undefined;

  return (
    <div className={className} data-testid="paginated-table">
      {showLastPageNotice && (
        <Alert
          type="info"
          headingLevel="h4"
          slim
          role="status"
          className="margin-bottom-2"
          data-testid="paginated-table-last-page-notice"
        >
          {resolvedLastPageNotice}
        </Alert>
      )}

      {isLoading && (
        <div
          className="display-flex flex-align-center margin-bottom-2"
          role="status"
          aria-live="polite"
          data-testid="paginated-table-loading-indicator"
        >
          <Spinner className="sm margin-right-1" />
          <span>{resolvedLoadingMessage}</span>
        </div>
      )}

      {renderSummary && paginationInfo && renderSummary(paginationInfo)}

      <div
        aria-busy={isLoading}
        className={clsx({ "paginated-table-loading": isLoading })}
        data-testid="paginated-table-content"
      >
        <TableWithResponsiveHeader
          headerContent={headerContent}
          tableRowData={tableRowData}
          rowKeys={rowKeys}
        />
      </div>

      {totalPages > 0 && (
        <Pagination
          className={clsx(
            "grants-pagination flex-justify-start tablet:flex-justify-end margin-top-3",
            { disabled: isLoading },
            paginationClassName,
          )}
          aria-disabled={isLoading}
          pathname={pathname}
          totalPages={totalPages}
          currentPage={currentPage}
          maxSlots={MAX_PAGINATION_SLOTS}
          onClickNext={() => handlePageChange(currentPage + 1)}
          onClickPrevious={() => handlePageChange(currentPage - 1)}
          onClickPageNumber={(
            event: MouseEvent<HTMLButtonElement>,
            page: number,
          ) => {
            event.preventDefault();
            handlePageChange(page);
          }}
        />
      )}
    </div>
  );
}
