import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import {
  LAST_PAGE_MESSAGE,
  PaginatedTable,
  PaginatedTablePage,
} from "src/components/core/PaginatedTable";

const mockSetQueryParam = jest.fn();
let mockPageParam: string | null = null;

jest.mock("next/navigation", () => ({
  usePathname: () => "/test-path",
}));

// the mock setQueryParam also updates the mocked page param, simulating
// the URL actually changing after navigation the way it does in the app
jest.mock("src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    searchParams: {
      get: (key: string) => (key === "page" ? mockPageParam : null),
    },
    setQueryParam: (key: string, value: string) => {
      mockSetQueryParam(key, value);
      if (key === "page") {
        mockPageParam = value;
      }
    },
  }),
}));

const headerContent = [{ cellData: "Name" }, { cellData: "Value" }];

const getRowData = (row: string) => [
  { cellData: `name ${row}` },
  { cellData: `value ${row}` },
];

const getRowKey = (row: string) => row;

const pageResult = (
  page: number,
  totalPages: number,
): PaginatedTablePage<string> => ({
  data: [`${page}-a`, `${page}-b`],
  totalPages,
});

const deferred = <T,>() => {
  let resolveFn!: (value: T) => void;
  let rejectFn!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolveFn = resolve;
    rejectFn = reject;
  });
  return { promise, resolve: resolveFn, reject: rejectFn };
};

const buildElement = (
  fetchPage: jest.Mock,
  props: Partial<React.ComponentProps<typeof PaginatedTable<string>>> = {},
) => (
  <PaginatedTable<string>
    fetchPage={fetchPage}
    headerContent={headerContent}
    getRowData={getRowData}
    getRowKey={getRowKey}
    errorMessage="the data could not be loaded"
    {...props}
  />
);

const renderTable = (
  fetchPage: jest.Mock,
  props: Partial<React.ComponentProps<typeof PaginatedTable<string>>> = {},
) => {
  const utils = render(buildElement(fetchPage, props));
  return {
    ...utils,
    // simulates the re-render the app router produces after the URL changes
    rerenderTable: () => utils.rerender(buildElement(fetchPage, props)),
  };
};

beforeEach(() => {
  jest.clearAllMocks();
  mockPageParam = null;
});

describe("PaginatedTable", () => {
  it("passes accessibility test", async () => {
    const fetchPage = jest
      .fn()
      .mockImplementation((page: number) =>
        Promise.resolve(pageResult(page, 3)),
      );
    const { container } = renderTable(fetchPage);

    expect(await screen.findByText("name 1-a")).toBeInTheDocument();
    const results = await axe(container, {
      rules: {
        // known third party component issues, see SearchPagination tests
        list: { enabled: false },
        "svg-img-alt": { enabled: false },
      },
    });
    expect(results).toHaveNoViolations();
  });

  it("shows a loading state before the first page loads", async () => {
    const pending = deferred<PaginatedTablePage<string>>();
    const fetchPage = jest.fn().mockReturnValue(pending.promise);
    renderTable(fetchPage);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading the table...",
    );
    expect(screen.queryByRole("table")).not.toBeInTheDocument();

    pending.resolve(pageResult(1, 1));
    expect(await screen.findByText("name 1-a")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("fetches and displays page 1 by default when the URL has no page", async () => {
    const fetchPage = jest
      .fn()
      .mockImplementation((page: number) =>
        Promise.resolve(pageResult(page, 3)),
      );
    renderTable(fetchPage);

    expect(await screen.findByText("name 1-a")).toBeInTheDocument();
    expect(screen.getByText("value 1-b")).toBeInTheDocument();
    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(fetchPage).toHaveBeenCalledWith(1);
    expect(
      screen.getByRole("columnheader", { name: "Name" }),
    ).toBeInTheDocument();
  });

  it("respects the page id in the query URL", async () => {
    mockPageParam = "3";
    const fetchPage = jest
      .fn()
      .mockImplementation((page: number) =>
        Promise.resolve(pageResult(page, 5)),
      );
    renderTable(fetchPage);

    expect(await screen.findByText("name 3-a")).toBeInTheDocument();
    expect(fetchPage).toHaveBeenCalledWith(3);
  });

  it("uses initialPage when the URL does not specify a page", async () => {
    const fetchPage = jest
      .fn()
      .mockImplementation((page: number) =>
        Promise.resolve(pageResult(page, 5)),
      );
    renderTable(fetchPage, { initialPage: 2 });

    expect(await screen.findByText("name 2-a")).toBeInTheDocument();
    expect(fetchPage).toHaveBeenCalledWith(2);
  });

  it("falls back to page 1 when the page in the URL is not a valid page number", async () => {
    mockPageParam = "not-a-page";
    const fetchPage = jest
      .fn()
      .mockImplementation((page: number) =>
        Promise.resolve(pageResult(page, 5)),
      );
    renderTable(fetchPage);

    expect(await screen.findByText("name 1-a")).toBeInTheDocument();
    expect(fetchPage).toHaveBeenCalledWith(1);
  });

  it("does not refetch when re-rendered with a new fetch function for the same page", async () => {
    const firstFetch = jest
      .fn()
      .mockImplementation((page: number) =>
        Promise.resolve(pageResult(page, 3)),
      );
    const { rerender } = renderTable(firstFetch);
    expect(await screen.findByText("name 1-a")).toBeInTheDocument();

    const secondFetch = jest
      .fn()
      .mockImplementation((page: number) =>
        Promise.resolve(pageResult(page, 3)),
      );
    rerender(
      <PaginatedTable<string>
        fetchPage={secondFetch}
        headerContent={headerContent}
        getRowData={getRowData}
        getRowKey={getRowKey}
        errorMessage="the data could not be loaded"
      />,
    );

    await waitFor(() => expect(secondFetch).not.toHaveBeenCalled());
    expect(firstFetch).toHaveBeenCalledTimes(1);
  });

  it("displays pagination with just one page when only one page is available", async () => {
    const fetchPage = jest
      .fn()
      .mockImplementation((page: number) =>
        Promise.resolve(pageResult(page, 1)),
      );
    renderTable(fetchPage);

    expect(await screen.findByText("name 1-a")).toBeInTheDocument();
    const nav = screen.getByRole("navigation");
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /page 1/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Next page" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Previous page" }),
    ).not.toBeInTheDocument();
  });

  it("updates the URL when a page number is clicked", async () => {
    const user = userEvent.setup();
    const fetchPage = jest
      .fn()
      .mockImplementation((page: number) =>
        Promise.resolve(pageResult(page, 5)),
      );
    const { rerenderTable } = renderTable(fetchPage);
    expect(await screen.findByText("name 1-a")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /page 3/i }));

    expect(mockSetQueryParam).toHaveBeenCalledWith("page", "3");
    rerenderTable();
    expect(await screen.findByText("name 3-a")).toBeInTheDocument();
    expect(fetchPage).toHaveBeenCalledWith(3);
  });

  it("updates the URL when next and previous are clicked", async () => {
    const user = userEvent.setup();
    mockPageParam = "2";
    const fetchPage = jest
      .fn()
      .mockImplementation((page: number) =>
        Promise.resolve(pageResult(page, 5)),
      );
    const { rerenderTable } = renderTable(fetchPage);
    expect(await screen.findByText("name 2-a")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(mockSetQueryParam).toHaveBeenCalledWith("page", "3");
    rerenderTable();
    expect(await screen.findByText("name 3-a")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Previous page" }));
    expect(mockSetQueryParam).toHaveBeenCalledWith("page", "2");
    rerenderTable();
    expect(await screen.findByText("name 2-a")).toBeInTheDocument();
  });

  it("disables pagination and keeps current data visible while the next page loads", async () => {
    const user = userEvent.setup();
    const pending = deferred<PaginatedTablePage<string>>();
    const fetchPage = jest
      .fn()
      .mockImplementation((page: number) =>
        page === 1 ? Promise.resolve(pageResult(1, 3)) : pending.promise,
      );
    const { rerenderTable } = renderTable(fetchPage);
    expect(await screen.findByText("name 1-a")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /page 2/i }));
    rerenderTable();

    // previous data stays on screen and pagination is disabled while loading
    expect(screen.getByText("name 1-a")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading the table...",
    );
    expect(screen.getByRole("navigation")).toHaveAttribute(
      "aria-disabled",
      "true",
    );

    // clicking again while loading does not navigate further
    await user.click(screen.getByRole("button", { name: /page 3/i }));
    expect(mockSetQueryParam).toHaveBeenCalledTimes(1);

    pending.resolve(pageResult(2, 3));
    expect(await screen.findByText("name 2-a")).toBeInTheDocument();
    expect(screen.getByRole("navigation")).toHaveAttribute(
      "aria-disabled",
      "false",
    );
  });

  it("discards a stale response that arrives after a newer page has loaded", async () => {
    const pageTwo = deferred<PaginatedTablePage<string>>();
    const pageThree = deferred<PaginatedTablePage<string>>();
    const fetchPage = jest.fn().mockImplementation((page: number) => {
      if (page === 2) return pageTwo.promise;
      if (page === 3) return pageThree.promise;
      return Promise.resolve(pageResult(page, 5));
    });
    const { rerender } = renderTable(fetchPage);
    expect(await screen.findByText("name 1-a")).toBeInTheDocument();

    const rerenderWithPage = (page: string) => {
      mockPageParam = page;
      rerender(
        <PaginatedTable<string>
          fetchPage={fetchPage}
          headerContent={headerContent}
          getRowData={getRowData}
          getRowKey={getRowKey}
          errorMessage="the data could not be loaded"
        />,
      );
    };

    rerenderWithPage("2");
    rerenderWithPage("3");

    pageThree.resolve(pageResult(3, 5));
    expect(await screen.findByText("name 3-a")).toBeInTheDocument();

    // the slower page 2 response must not overwrite page 3
    pageTwo.resolve(pageResult(2, 5));
    await waitFor(() => expect(fetchPage).toHaveBeenCalledTimes(3));
    expect(screen.getByText("name 3-a")).toBeInTheDocument();
    expect(screen.queryByText("name 2-a")).not.toBeInTheDocument();
  });

  it("displays the error message in place of the table when data fails to load", async () => {
    const fetchPage = jest.fn().mockRejectedValue(new Error("fetch failed"));
    renderTable(fetchPage);

    expect(
      await screen.findByText("the data could not be loaded"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("clears the error state when a later fetch of the failed page succeeds", async () => {
    let pageTwoAttempts = 0;
    const fetchPage = jest.fn().mockImplementation((page: number) => {
      if (page === 2) {
        pageTwoAttempts += 1;
        if (pageTwoAttempts === 1) {
          return Promise.reject(new Error("fetch failed"));
        }
      }
      return Promise.resolve(pageResult(page, 3));
    });
    const { rerenderTable } = renderTable(fetchPage);
    expect(await screen.findByText("name 1-a")).toBeInTheDocument();

    // navigate to page 2, which fails
    mockPageParam = "2";
    rerenderTable();
    expect(
      await screen.findByText("the data could not be loaded"),
    ).toBeInTheDocument();

    // navigate away and back; the retry succeeds and the error is gone
    mockPageParam = "1";
    rerenderTable();
    expect(await screen.findByText("name 1-a")).toBeInTheDocument();

    mockPageParam = "2";
    rerenderTable();
    expect(await screen.findByText("name 2-a")).toBeInTheDocument();
    expect(
      screen.queryByText("the data could not be loaded"),
    ).not.toBeInTheDocument();
  });

  it("displays custom empty content when no data is returned", async () => {
    const fetchPage = jest.fn().mockResolvedValue({ data: [], totalPages: 0 });
    renderTable(fetchPage, { emptyContent: <p>nothing to see here</p> });

    expect(await screen.findByText("nothing to see here")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("fetches the last page and updates the URL when the requested page is past the end", async () => {
    mockPageParam = "9";
    const fetchPage = jest.fn().mockImplementation((page: number) => {
      if (page === 9) {
        return Promise.resolve({ data: [], totalPages: 3 });
      }
      return Promise.resolve(pageResult(page, 3));
    });
    renderTable(fetchPage);

    expect(await screen.findByText("name 3-a")).toBeInTheDocument();
    expect(fetchPage).toHaveBeenCalledWith(9);
    expect(fetchPage).toHaveBeenCalledWith(3);
    expect(mockSetQueryParam).toHaveBeenCalledWith("page", "3");
    expect(screen.getByText(LAST_PAGE_MESSAGE)).toBeInTheDocument();
  });

  it("does not show the last page message after navigating away from the corrected page", async () => {
    const user = userEvent.setup();
    mockPageParam = "9";
    const fetchPage = jest.fn().mockImplementation((page: number) => {
      if (page === 9) {
        return Promise.resolve({ data: [], totalPages: 3 });
      }
      return Promise.resolve(pageResult(page, 3));
    });
    const { rerenderTable } = renderTable(fetchPage);
    expect(await screen.findByText(LAST_PAGE_MESSAGE)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /page 1/i }));
    rerenderTable();

    expect(await screen.findByText("name 1-a")).toBeInTheDocument();
    expect(screen.queryByText(LAST_PAGE_MESSAGE)).not.toBeInTheDocument();
  });
});
