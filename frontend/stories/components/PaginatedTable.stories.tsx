import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  PaginatedTable,
  PaginatedTableProps,
  PaginatedTableResponse,
} from "src/components/core/PaginatedTable";
import { TableCellData } from "src/components/core/TableWithResponsiveHeader";

interface SampleApplication {
  id: string;
  closeDate: string;
  status: "Draft" | "Submitted";
  applicationName: string;
  organization: string;
  opportunityTitle: string;
}

const sampleHeaders: TableCellData[] = [
  { cellData: "Close date" },
  { cellData: "Status" },
  { cellData: "Application name" },
  { cellData: "Type" },
  { cellData: "Opportunity" },
];

const mapSampleRow = (app: SampleApplication): TableCellData[] => [
  { cellData: app.closeDate },
  { cellData: app.status },
  { cellData: app.applicationName },
  { cellData: app.organization },
  { cellData: app.opportunityTitle },
];

const buildMockDataset = (totalRecords: number): SampleApplication[] =>
  Array.from({ length: totalRecords }, (_, idx) => ({
    id: `app-${idx + 1}`,
    closeDate: `2026-12-${String((idx % 28) + 1).padStart(2, "0")}`,
    status: idx % 3 === 0 ? "Submitted" : "Draft",
    applicationName: `Community Health Initiative #${idx + 1}`,
    organization: idx % 2 === 0 ? "Individual" : "Metro Health Foundation",
    opportunityTitle: `HHS Public Health Modernization Grant ${idx + 1}`,
  }));

const createMockFetcher = (
  totalRecords: number,
  pageSize = 5,
  delayMs = 200,
) => {
  const dataset = buildMockDataset(totalRecords);
  const totalPages = Math.ceil(totalRecords / pageSize);

  return async (
    page: number,
  ): Promise<PaginatedTableResponse<SampleApplication>> => {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    if (totalPages === 0 || page > totalPages) {
      return {
        data: [],
        paginationInfo: {
          page_offset: page,
          page_size: pageSize,
          total_pages: totalPages,
          total_records: totalRecords,
        },
      };
    }

    const start = (page - 1) * pageSize;
    return {
      data: dataset.slice(start, start + pageSize),
      paginationInfo: {
        page_offset: page,
        page_size: pageSize,
        total_pages: totalPages,
        total_records: totalRecords,
      },
    };
  };
};

type SamplePaginatedTableProps = PaginatedTableProps<SampleApplication>;

const meta: Meta<SamplePaginatedTableProps> = {
  title: "Components/PaginatedTable",
  component: PaginatedTable<SampleApplication>,
  parameters: {
    nextjs: {
      appDirectory: true,
    },
  },
  args: {
    headerContent: sampleHeaders,
    mapRow: mapSampleRow,
    getRowKey: (item) => item.id,
    errorMessage:
      "We have encountered an error loading your applications, please try again later.",
    emptyState: (
      <div>
        <div className="font-sans-xl text-bold margin-bottom-2">
          You have not started any applications
        </div>
        <div>Search for funding opportunities to begin a new application.</div>
      </div>
    ),
    syncUrl: false,
  },
};

export default meta;
type Story = StoryObj<SamplePaginatedTableProps>;

export const MultiPage: Story = {
  args: {
    fetchPage: createMockFetcher(60, 5, 250),
    renderSummary: (info) => (
      <div className="font-sans-lg text-bold margin-bottom-2">
        {info.total_records} applications
      </div>
    ),
  },
};

export const SinglePage: Story = {
  args: {
    fetchPage: createMockFetcher(3, 5, 100),
    renderSummary: (info) => (
      <div className="font-sans-lg text-bold margin-bottom-2">
        {info.total_records} applications
      </div>
    ),
  },
};

export const SlowNetworkLoading: Story = {
  args: {
    fetchPage: createMockFetcher(35, 5, 1500),
    renderSummary: (info) => (
      <div className="font-sans-lg text-bold margin-bottom-2">
        {info.total_records} applications
      </div>
    ),
  },
};

export const InitialLoading: Story = {
  args: {
    fetchPage: () => new Promise(() => {}),
  },
};

export const OutOfRangeLastPageRecovery: Story = {
  args: {
    initialPage: 99,
    fetchPage: createMockFetcher(18, 5, 250),
    renderSummary: (info) => (
      <div className="font-sans-lg text-bold margin-bottom-2">
        {info.total_records} applications
      </div>
    ),
  },
};

export const EmptyState: Story = {
  args: {
    fetchPage: createMockFetcher(0, 5, 100),
  },
};

export const ErrorState: Story = {
  args: {
    fetchPage: async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
      throw new Error("Simulated API failure");
    },
  },
};
