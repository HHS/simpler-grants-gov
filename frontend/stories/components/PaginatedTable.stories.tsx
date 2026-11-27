import {
  PaginatedTable,
  PaginatedTablePage,
} from "src/components/core/PaginatedTable";

type ExampleRow = {
  name: string;
  status: string;
};

const headerContent = [{ cellData: "Name" }, { cellData: "Status" }];

const getRowData = (row: ExampleRow) => [
  { cellData: row.name },
  { cellData: row.status },
];

const getRowKey = (row: ExampleRow) => row.name;

const rowsForPage = (page: number): ExampleRow[] => [
  { name: `Example row ${page}-1`, status: "Open" },
  { name: `Example row ${page}-2`, status: "Closed" },
  { name: `Example row ${page}-3`, status: "Open" },
];

// simulates an API that reports the total number of pages and, like the
// real APIs, returns no rows for a page past the end of the data
const fakeFetchPage =
  (totalPages: number, delayMs = 500) =>
  (page: number): Promise<PaginatedTablePage<ExampleRow>> =>
    new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: page <= totalPages ? rowsForPage(page) : [],
          totalPages,
        });
      }, delayMs);
    });

const meta = {
  title: "Components/PaginatedTable",
  component: PaginatedTable,
  args: {
    headerContent,
    getRowData,
    getRowKey,
    errorMessage: "There was an error loading the table. Please try again.",
  },
};
export default meta;

export const Default = {
  args: {
    fetchPage: fakeFetchPage(5),
  },
};

export const SinglePage = {
  args: {
    fetchPage: fakeFetchPage(1),
  },
};

export const Loading = {
  args: {
    fetchPage: () => new Promise<PaginatedTablePage<ExampleRow>>(() => {}),
  },
};

export const ErrorState = {
  args: {
    fetchPage: () => Promise.reject(new Error("simulated API failure")),
  },
};

export const Empty = {
  args: {
    fetchPage: fakeFetchPage(0),
    emptyContent: <p>There are no example rows to display.</p>,
  },
};

// starts on a page past the end of the data, so the component fetches and
// displays the last available page instead
export const LastPage = {
  args: {
    fetchPage: fakeFetchPage(3),
    initialPage: 9,
  },
};
