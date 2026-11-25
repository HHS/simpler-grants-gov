import React from "react";
import {
  fakeResponsiveTableHeaders,
  fakeResponsiveTableRows,
} from "src/utils/testing/fixtures";

import { TableWithResponsiveHeader } from "src/components/core/TableWithResponsiveHeader";
import { PaginatedTable } from "src/components/core/PaginatedTable";

const meta = {
  title: "Components/TableWithResponsiveHeader",
  component: TableWithResponsiveHeader,
  args: {
    headerContent: [],
    tableRowData: [],
  },
};
export default meta;

export const Default = {
  args: {
    headerContent: fakeResponsiveTableHeaders,
    tableRowData: fakeResponsiveTableRows,
  },
};

export const Paginated = {
  render: () => {
    const mockFetchData = async (page: number, pageSize: number) => {
      const startIndex = (page - 1) * pageSize;
      const paginatedRows = fakeResponsiveTableRows.slice(
        startIndex,
        startIndex + pageSize
      );
      return {
        data: paginatedRows,
        totalPages: Math.ceil(fakeResponsiveTableRows.length / pageSize) || 1,
        totalItems: fakeResponsiveTableRows.length,
      };
    };

    return (
      <PaginatedTable
        headerContent={fakeResponsiveTableHeaders}
        fetchData={mockFetchData}
        pageSize={2}
        pageSizeOptions={[2, 5, 10]}
      />
    );
  },
};
