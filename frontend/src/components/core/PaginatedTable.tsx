import React, { useState, useEffect, useCallback, useRef } from "react";
import { TableWithResponsiveHeader } from "src/components/core/TableWithResponsiveHeader";

export interface PaginatedTableFetchResult<T = any> {
  data: T[];
  totalPages: number;
  totalItems?: number;
}

export type FetchDataFn<T = any> = (
  page: number,
  pageSize: number
) => Promise<PaginatedTableFetchResult<T>> | PaginatedTableFetchResult<T>;

export interface PaginatedTableProps<T = any> {
  headerContent: any[];
  fetchData: FetchDataFn<T>;
  initialPage?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  ariaLabel?: string;
  className?: string;
  onPageChange?: (page: number) => void;
  onError?: (error: Error) => void;
  loadingComponent?: React.ReactNode;
  emptyStateComponent?: React.ReactNode;
}

export const PaginatedTable = <T = any,>({
  headerContent,
  fetchData,
  initialPage = 1,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  ariaLabel = "Paginated Data Table",
  className = "",
  onPageChange,
  onError,
  loadingComponent,
  emptyStateComponent,
}: PaginatedTableProps<T>) => {
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [tableRows, setTableRows] = useState<T[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchDataRef = useRef(fetchData);
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  const loadData = useCallback(
    async (page: number, size: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await fetchDataRef.current(page, size);
        setTableRows(result.data || []);
        const calculatedTotalPages = Math.max(1, result.totalPages || 1);
        setTotalPages(calculatedTotalPages);
        setTotalItems(result.totalItems);
        setCurrentPage(page);
      } catch (err) {
        const errObj = err instanceof Error ? err : new Error(String(err));
        setError(errObj);
        if (onError) {
          onError(errObj);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [onError]
  );

  useEffect(() => {
    loadData(currentPage, pageSize);
  }, [currentPage, pageSize, loadData]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || isLoading || newPage === currentPage) {
      return;
    }
    setCurrentPage(newPage);
    if (onPageChange) {
      onPageChange(newPage);
    }
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = Number(e.target.value);
    setPageSize(newSize);
    setCurrentPage(1);
    if (onPageChange) {
      onPageChange(1);
    }
  };

  const calculateItemRange = () => {
    if (totalItems !== undefined) {
      const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
      const end = Math.min(currentPage * pageSize, totalItems);
      return `Showing ${start}–${end} of ${totalItems} items`;
    }
    return `Page ${currentPage} of ${totalPages}`;
  };

  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push("...");
      }
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        if (i > 1 && i < totalPages) {
          pages.push(i);
        }
      }
      if (currentPage < totalPages - 2) {
        pages.push("...");
      }
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className={`paginated-table-container ${className}`.trim()} aria-label={ariaLabel}>
      {isLoading ? (
        loadingComponent || (
          <div className="paginated-table-loading" role="status" aria-live="polite">
            Loading table data...
          </div>
        )
      ) : error ? (
        <div className="paginated-table-error" role="alert">
          <p>Failed to load data: {error.message}</p>
          <button
            type="button"
            className="usa-button usa-button--outline"
            onClick={() => loadData(currentPage, pageSize)}
          >
            Retry
          </button>
        </div>
      ) : tableRows.length === 0 ? (
        emptyStateComponent || (
          <div className="paginated-table-empty" role="status">
            No data available
          </div>
        )
      ) : (
        <TableWithResponsiveHeader
          headerContent={headerContent}
          tableRowData={tableRows}
        />
      )}

      <div className="paginated-table-controls flex justify-between items-center mt-4">
        <div className="paginated-table-info text-sm text-gray-700">
          {calculateItemRange()}
        </div>

        <div className="paginated-table-pagination flex items-center space-x-4">
          {pageSizeOptions.length > 0 && (
            <div className="paginated-table-page-size flex items-center space-x-2">
              <label htmlFor="page-size-select" className="text-sm">
                Rows per page:
              </label>
              <select
                id="page-size-select"
                className="usa-select text-sm py-1 px-2 border rounded"
                value={pageSize}
                onChange={handlePageSizeChange}
                disabled={isLoading}
              >
                {pageSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}

          <nav aria-label="Pagination navigation" className="flex items-center space-x-1">
            <button
              type="button"
              className="usa-button usa-button--unstyled px-2 py-1 disabled:opacity-50"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isLoading}
              aria-label="Go to previous page"
            >
              Previous
            </button>

            {renderPageNumbers().map((pageItem, index) => {
              if (typeof pageItem === "string") {
                return (
                  <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                    {pageItem}
                  </span>
                );
              }
              const isCurrent = pageItem === currentPage;
              return (
                <button
                  key={pageItem}
                  type="button"
                  className={`px-3 py-1 rounded text-sm ${
                    isCurrent
                      ? "bg-blue-600 text-white font-semibold"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                  onClick={() => handlePageChange(pageItem)}
                  disabled={isLoading}
                  aria-current={isCurrent ? "page" : undefined}
                  aria-label={`Page ${pageItem}`}
                >
                  {pageItem}
                </button>
              );
            })}

            <button
              type="button"
              className="usa-button usa-button--unstyled px-2 py-1 disabled:opacity-50"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isLoading}
              aria-label="Go to next page"
            >
              Next
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};
