"use client";

import clsx from "clsx";

import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactNode, useEffect, useRef, useState, useTransition } from "react";
import { Pagination } from "@trussworks/react-uswds";

import Spinner from "src/components/core/Spinner";
import { buildPageUrl, PAGINATED_TABLE_MAX_SLOTS } from "./paginatedTableUtils";

export type PaginatedTableClientShellProps = {
  // the page that the server rendered table content belongs to
  page: number;
  totalPages: number;
  // when true, the URL is rewritten in place to reflect `page`
  // (used when a page past the end of the data set was requested)
  syncUrlToPage?: boolean;
  children: ReactNode;
};

// Client side portion of the PaginatedTable. The table itself is rendered on the server
// and passed in as children, this component handles:
// - page navigation via the `page` URL search param
// - loading state while the next page is fetched (dimmed table, disabled pagination, live region)
// - correcting the URL when the server fell back to the last available page
// - moving focus back to the top of the table after a page change
export function PaginatedTableClientShell({
  page,
  totalPages,
  syncUrlToPage = false,
  children,
}: PaginatedTableClientShellProps) {
  const t = useTranslations("PaginatedTable");
  const router = useRouter();
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [requestedPage, setRequestedPage] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userNavigatedRef = useRef(false);

  const loadingPage = isPending ? requestedPage : null;
  const isLoading = loadingPage !== null;

  // Rewrite the url without triggering a new server render, so that the "last page"
  // notice stays visible and the back button does not lead back to an empty page.
  // Next integrates window.history.replaceState with its router (useSearchParams stays in sync).
  useEffect(() => {
    if (!syncUrlToPage) {
      return;
    }
    window.history.replaceState(
      window.history.state,
      "",
      buildPageUrl(pathname, window.location.search, page),
    );
  }, [syncUrlToPage, page, pathname]);

  // after the user moves to a new page, bring focus (and scroll) to the top of the table
  // so keyboard and screen reader users are not left at the bottom pagination controls
  useEffect(() => {
    if (userNavigatedRef.current) {
      userNavigatedRef.current = false;
      containerRef.current?.focus();
    }
  }, [page]);

  const goToPage = (targetPage: number) => {
    if (
      isLoading ||
      targetPage === page ||
      targetPage < 1 ||
      targetPage > totalPages
    ) {
      return;
    }
    userNavigatedRef.current = true;
    setRequestedPage(targetPage);
    startTransition(() => {
      router.push(buildPageUrl(pathname, searchParams, targetPage), {
        scroll: false,
      });
    });
  };

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className="paginated-table outline-0"
      data-testid="paginated-table"
      aria-busy={isLoading}
    >
      <div aria-live="polite" className="usa-sr-only">
        {isLoading ? t("loadingPage", { page: loadingPage }) : ""}
      </div>
      <div
        className={clsx("paginated-table__content", {
          "paginated-table__content--loading": isLoading,
        })}
        data-testid="paginated-table-content"
      >
        {isLoading && (
          <div
            className="paginated-table__loading-indicator"
            data-testid="paginated-table-loading"
            aria-hidden="true"
          >
            <Spinner />
          </div>
        )}
        {children}
      </div>
      {totalPages > 0 && (
        <Pagination
          className={clsx(
            "grants-pagination flex-justify-start tablet:flex-justify-end",
            { disabled: isLoading },
          )}
          aria-disabled={isLoading}
          pathname={pathname}
          totalPages={totalPages}
          currentPage={page}
          maxSlots={PAGINATED_TABLE_MAX_SLOTS}
          onClickNext={() => goToPage(page + 1)}
          onClickPrevious={() => goToPage(page - 1)}
          onClickPageNumber={(event, pageNumber) => {
            event.preventDefault();
            goToPage(pageNumber);
          }}
        />
      )}
    </div>
  );
}
