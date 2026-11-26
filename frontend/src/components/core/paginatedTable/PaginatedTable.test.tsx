import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { identity } from "lodash";
import { UnauthorizedError } from "src/errors";

import {
  PaginatedTable,
  ResolvedPaginatedTable,
} from "src/components/core/paginatedTable/PaginatedTable";
import { PaginatedTableResponse } from "src/components/core/paginatedTable/paginatedTableTypes";

const mockLoggerError = jest.fn();
const mockShell = jest.fn();

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
}));

jest.mock("src/services/logger/simplerLogger", () => ({
  logger: {
    error: (...args: unknown[]) => mockLoggerError(...args) as unknown,
  },
}));

// the client shell is tested on its own, here we only verify what it is given
jest.mock(
  "src/components/core/paginatedTable/PaginatedTableClientShell",
  () => ({
    PaginatedTableClientShell: (props: {
      page: number;
      totalPages: number;
      syncUrlToPage?: boolean;
      children: React.ReactNode;
    }) => {
      mockShell(props);
      return <div data-testid="mock-shell">{props.children}</div>;
    },
  }),
);

type Item = { id: string; name: string; count: number };

const headerContent = [{ cellData: "Name" }, { cellData: "Count" }];
const mapRowData = (item: Item) => [
  { cellData: item.name },
  { cellData: item.count },
];

const items = (n: number, prefix = "item"): Item[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `${prefix}-${i}`,
    name: `${prefix} ${i}`,
    count: i,
  }));

const response = (
  data: Item[],
  page: number,
  totalPages: number,
  totalRecords = data.length,
): PaginatedTableResponse<Item> => ({
  data,
  pagination_info: {
    page_offset: page,
    total_pages: totalPages,
    total_records: totalRecords,
  },
});

const renderResolved = async (
  props: Partial<Parameters<typeof ResolvedPaginatedTable<Item>>[0]> = {},
) => {
  const component = await ResolvedPaginatedTable<Item>({
    fetchPage: jest.fn().mockResolvedValue(response(items(2), 1, 1)),
    page: 1,
    headerContent,
    mapRowData,
    errorMessage: "could not load",
    ...props,
  });
  return render(component);
};

describe("ResolvedPaginatedTable", () => {
  beforeEach(() => jest.clearAllMocks());

  it("fetches the requested page", async () => {
    const fetchPage = jest.fn().mockResolvedValue(response(items(2), 2, 4));
    await renderResolved({ fetchPage, page: 2 });
    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(fetchPage).toHaveBeenCalledWith(2);
  });

  it("renders column titles and mapped row data", async () => {
    await renderResolved({
      fetchPage: jest.fn().mockResolvedValue(response(items(3), 1, 1)),
    });

    expect(screen.getAllByRole("columnheader")).toHaveLength(2);
    expect(
      screen.getByRole("columnheader", { name: "Name" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(4); // header + 3 rows
    expect(screen.getByText("item 0")).toBeInTheDocument();
    expect(screen.getByText("item 2")).toBeInTheDocument();
  });

  it("passes the item index to mapRowData", async () => {
    const mapper = jest.fn((item: Item, _index: number) => mapRowData(item));
    await renderResolved({
      fetchPage: jest.fn().mockResolvedValue(response(items(2), 1, 1)),
      mapRowData: mapper,
    });
    expect(mapper).toHaveBeenCalledTimes(2);
    expect(mapper.mock.calls[1][1]).toBe(1);
  });

  it("uses getRowKey for row keys when provided", async () => {
    const getRowKey = jest.fn((item: Item) => item.id);
    await renderResolved({ getRowKey });
    expect(getRowKey).toHaveBeenCalledTimes(2);
  });

  it("passes page and total pages to the pagination shell", async () => {
    await renderResolved({
      fetchPage: jest.fn().mockResolvedValue(response(items(25), 2, 4, 90)),
      page: 2,
    });
    expect(mockShell).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
        totalPages: 4,
        syncUrlToPage: false,
      }),
    );
  });

  it("renders the summary with pagination info", async () => {
    const renderSummary = jest.fn(
      ({ total_records }: { total_records: number }) => (
        <span>{total_records} things</span>
      ),
    );
    await renderResolved({
      fetchPage: jest.fn().mockResolvedValue(response(items(25), 1, 4, 90)),
      renderSummary,
    });
    expect(screen.getByText("90 things")).toBeInTheDocument();
    expect(renderSummary).toHaveBeenCalledWith(
      expect.objectContaining({ total_pages: 4, total_records: 90 }),
    );
  });

  it("does not show the last page notice for a normal page", async () => {
    await renderResolved();
    expect(
      screen.queryByTestId("paginated-table-last-page-alert"),
    ).not.toBeInTheDocument();
  });

  describe("errors", () => {
    it("renders the error message in place of the table when the fetch fails", async () => {
      const error = new Error("nope");
      await renderResolved({ fetchPage: jest.fn().mockRejectedValue(error) });

      expect(screen.getByTestId("paginated-table-error")).toBeVisible();
      expect(screen.getByText("could not load")).toBeVisible();
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      expect(mockShell).not.toHaveBeenCalled();
      expect(mockLoggerError).toHaveBeenCalledWith(
        { err: error },
        expect.any(String),
      );
    });

    it("accepts a node as the error message", async () => {
      await renderResolved({
        fetchPage: jest.fn().mockRejectedValue(new Error("nope")),
        errorMessage: <strong>custom error node</strong>,
      });
      expect(screen.getByText("custom error node").tagName).toBe("STRONG");
    });

    it("renders the error message if the last page refetch fails", async () => {
      await renderResolved({
        page: 9,
        fetchPage: jest
          .fn()
          .mockResolvedValueOnce(response([], 9, 2, 30))
          .mockRejectedValueOnce(new Error("second")),
      });
      expect(screen.getByText("could not load")).toBeVisible();
    });

    it("lets unauthorized errors continue up the stack", async () => {
      await expect(
        ResolvedPaginatedTable<Item>({
          fetchPage: jest
            .fn()
            .mockRejectedValue(new UnauthorizedError("no session")),
          page: 1,
          headerContent,
          mapRowData,
          errorMessage: "could not load",
        }),
      ).rejects.toThrow(UnauthorizedError);
    });

    it("passes accessibility scan", async () => {
      const { container } = await renderResolved({
        fetchPage: jest.fn().mockRejectedValue(new Error("nope")),
      });
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe("empty data", () => {
    it("renders the empty message in place of the table", async () => {
      await renderResolved({
        fetchPage: jest.fn().mockResolvedValue(response([], 1, 0)),
        emptyMessage: <p>nothing here yet</p>,
      });
      expect(screen.getByText("nothing here yet")).toBeVisible();
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      expect(mockShell).not.toHaveBeenCalled();
    });

    it("renders nothing when no empty message is provided", async () => {
      const { container } = await renderResolved({
        fetchPage: jest.fn().mockResolvedValue(response([], 1, 0)),
      });
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("last page support", () => {
    it("refetches the last page when a page past the end is requested", async () => {
      const fetchPage = jest
        .fn()
        .mockResolvedValueOnce(response([], 8, 3, 60))
        .mockResolvedValueOnce(response(items(10, "last"), 3, 3, 60));

      await renderResolved({ fetchPage, page: 8 });

      expect(fetchPage).toHaveBeenNthCalledWith(1, 8);
      expect(fetchPage).toHaveBeenNthCalledWith(2, 3);
      expect(screen.getByText("last 0")).toBeInTheDocument();
    });

    it("shows the last page notice and asks the shell to correct the url", async () => {
      await renderResolved({
        page: 8,
        fetchPage: jest
          .fn()
          .mockResolvedValueOnce(response([], 8, 3, 60))
          .mockResolvedValueOnce(response(items(10), 3, 3, 60)),
      });

      expect(
        screen.getByTestId("paginated-table-last-page-alert"),
      ).toBeVisible();
      expect(screen.getByText("lastPageNotice")).toBeVisible();
      expect(mockShell).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 3,
          totalPages: 3,
          syncUrlToPage: true,
        }),
      );
    });

    it("renders the empty message if the data set became empty", async () => {
      await renderResolved({
        page: 4,
        fetchPage: jest.fn().mockResolvedValue(response([], 4, 0, 0)),
        emptyMessage: "all gone",
      });
      expect(screen.getByText("all gone")).toBeVisible();
    });

    it("passes accessibility scan", async () => {
      const { container } = await renderResolved({
        page: 8,
        fetchPage: jest
          .fn()
          .mockResolvedValueOnce(response([], 8, 3, 60))
          .mockResolvedValueOnce(response(items(10), 3, 3, 60)),
      });
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  it("passes accessibility scan", async () => {
    const { container } = await renderResolved();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("PaginatedTable", () => {
  it("wraps the resolved table in a suspense boundary with a loading skeleton", () => {
    const element = PaginatedTable<Item>({
      fetchPage: jest.fn(),
      page: 1,
      headerContent,
      mapRowData,
      errorMessage: "err",
    });

    // render only the fallback, as async server components can't be rendered on the client
    const { fallback } = element.props as { fallback: React.ReactElement };
    render(fallback);
    expect(screen.getByTestId("paginated-table-skeleton")).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("loading");
  });
});
