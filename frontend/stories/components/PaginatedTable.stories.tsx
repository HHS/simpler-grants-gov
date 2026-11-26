import { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PaginatedTableSkeleton } from "src/components/core/paginatedTable/PaginatedTableSkeleton";
import {
  PaginatedTableErrorMessage,
  PaginatedTableView,
} from "src/components/core/paginatedTable/PaginatedTableView";
import { TableCellData } from "src/components/core/TableWithResponsiveHeader";

// The data fetching PaginatedTable is an async server component, so these stories render
// its synchronous view (table + pagination), loading skeleton and error states directly.

const headerContent: TableCellData[] = [
  { cellData: "Close date" },
  { cellData: "Status" },
  { cellData: "Application filing name" },
  { cellData: "Type" },
];

const makeRows = (count: number, page = 1): TableCellData[][] =>
  Array.from({ length: count }, (_, i) => {
    const n = (page - 1) * count + i + 1;
    return [
      { cellData: `November ${(n % 28) + 1}, 2026` },
      { cellData: n % 2 ? "Draft" : "Submitted" },
      { cellData: <a href="#">Application {n}</a> },
      { cellData: n % 3 ? "Individual" : "Great Organization" },
    ];
  });

const summary = (total: number) => (
  <span className="font-sans-lg text-bold">{total} applications</span>
);

const meta: Meta<typeof PaginatedTableView> = {
  title: "Components/PaginatedTable",
  component: PaginatedTableView,
  args: {
    headerContent,
  },
};
export default meta;

type Story = StoryObj<typeof PaginatedTableView>;

export const SinglePage: Story = {
  args: {
    page: 1,
    totalPages: 1,
    tableRowData: makeRows(4),
    summary: summary(4),
  },
};

export const MultiplePages: Story = {
  args: {
    page: 1,
    totalPages: 3,
    tableRowData: makeRows(25),
    summary: summary(60),
  },
};

export const MultiplePagesMiddle: Story = {
  args: {
    page: 6,
    totalPages: 12,
    tableRowData: makeRows(25, 6),
    summary: summary(300),
  },
};

export const LastPageFallback: Story = {
  args: {
    page: 3,
    totalPages: 3,
    tableRowData: makeRows(10, 3),
    summary: summary(60),
    lastPageMessage:
      "The results have changed since this link was created. You\u2019re now viewing the last available page.",
  },
};

export const InitialLoading: StoryObj = {
  render: () => <PaginatedTableSkeleton />,
};

export const FetchError: StoryObj = {
  render: () => (
    <PaginatedTableErrorMessage message="We have encountered an error loading your applications, please try again later." />
  ),
};
