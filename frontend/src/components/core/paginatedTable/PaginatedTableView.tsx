import { ReactNode } from "react";
import { Alert } from "@trussworks/react-uswds";

import {
  TableCellData,
  TableWithResponsiveHeader,
} from "src/components/core/TableWithResponsiveHeader";
import { PaginatedTableClientShell } from "./PaginatedTableClientShell";

export type PaginatedTableViewProps = {
  page: number;
  totalPages: number;
  headerContent: TableCellData[];
  tableRowData: TableCellData[][];
  rowKeys?: string[];
  // optional content displayed above the table, ex. "52 applications"
  summary?: ReactNode;
  // message shown when the requested page no longer exists and the last page is shown instead
  lastPageMessage?: ReactNode;
};

// Synchronous, presentational portion of the PaginatedTable, separated out so it can be
// rendered directly in storybook and tests without a fetcher
export const PaginatedTableView = ({
  page,
  totalPages,
  headerContent,
  tableRowData,
  rowKeys,
  summary,
  lastPageMessage,
}: PaginatedTableViewProps) => {
  return (
    <PaginatedTableClientShell
      page={page}
      totalPages={totalPages}
      syncUrlToPage={!!lastPageMessage}
    >
      {lastPageMessage && (
        <Alert
          type="info"
          slim
          headingLevel="h4"
          className="margin-bottom-2"
          data-testid="paginated-table-last-page-alert"
        >
          {lastPageMessage}
        </Alert>
      )}
      {summary}
      <TableWithResponsiveHeader
        headerContent={headerContent}
        tableRowData={tableRowData}
        rowKeys={rowKeys}
      />
    </PaginatedTableClientShell>
  );
};

export const PaginatedTableErrorMessage = ({
  message,
}: {
  message: ReactNode;
}) => (
  <div className="margin-bottom-15" data-testid="paginated-table-error">
    <Alert slim headingLevel="h6" noIcon type="error">
      {message}
    </Alert>
  </div>
);
