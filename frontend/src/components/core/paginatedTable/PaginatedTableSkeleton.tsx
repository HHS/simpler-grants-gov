import { useTranslations } from "next-intl";

import Spinner from "src/components/core/Spinner";

// Displayed while the first page of data is fetched (Suspense fallback).
// Subsequent page changes keep the current table visible in a dimmed, disabled
// state instead (see PaginatedTableClientShell) to avoid layout jumps.
export const PaginatedTableSkeleton = () => {
  const t = useTranslations("PaginatedTable");
  return (
    <div
      className="display-flex flex-align-center flex-justify-center padding-y-6"
      data-testid="paginated-table-skeleton"
      aria-busy="true"
    >
      <Spinner />
      <span className="margin-left-1 font-sans-sm" role="status">
        {t("loading")}
      </span>
    </div>
  );
};
