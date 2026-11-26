import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { messages } from "src/i18n/messages/en";

import {
  buildPageUrl,
  PaginatedTable,
  PaginatedTableResponse,
  parsePageParam,
} from "src/components/core/PaginatedTable";
import { TableCellData } from "src/components/core/TableWithResponsiveHeader";

interface DemoItem {
  id: string;
  name: string;
  status: string;
}

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockUsePathname = jest.fn<string, []>();
const mockUseSearchParams = jest.fn<URLSearchParams, []>();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => mockUsePathname(),
  useSearchParams: () => mockUseSearchParams(),
}));

const demoHeaders: TableCellData[] = [
  { cellData: "Name" },
  { cellData: "Status" },
];

const mapDemoRow = (item: DemoItem): TableCellData[] => [
  { cellData: item.name },
  { cellData: item.status },
];

const createPageResponse = (
  page: number,
  totalPages: number,
  pageSize = 2,
  totalRecords = totalPages * pageSize,
): PaginatedTableResponse<DemoItem> => {
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

  const data: DemoItem[] = Array.from({ length: pageSize }, (_, idx) => {
    const num = (page - 1) * pageSize + idx + 1;
    return {
      id: `item-${num}`,
      name: `Grant Application ${num}`,
      status: num % 2 === 0 ? "Submitted" : "Draft",
    };
  });

  return {
    data,
    paginationInfo: {
      page_offset: page,
      page_size: pageSize,
      total_pages: totalPages,
      total_records: totalRecords,
    },
  };
};

const createDeferred = <T,>() => {
  let resolveDeferred!: (value: T) => void;
  let rejectDeferred!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolveDeferred = resolve;
    rejectDeferred = reject;
  });
  return { promise, resolve: resolveDeferred, reject: rejectDeferred };
};

describe("PaginatedTable helpers", () => {
  describe("parsePageParam", () => {
    it("returns fallback when param is missing or blank", () => {
      expect(parsePageParam(null)).toBe(1);
      expect(parsePageParam(undefined)).toBe(1);
      expect(parsePageParam("")).toBe(1);
      expect(parsePageParam("   ", 3)).toBe(3);
    });

    it("parses valid positive integer page numbers", () => {
      expect(parsePageParam("1")).toBe(1);
      expect(parsePageParam("4")).toBe(4);
      expect(parsePageParam("25")).toBe(25);
    });

    it("normalizes invalid, zero, negative, or fractional values to 1", () => {
      expect(parsePageParam("0")).toBe(1);
      expect(parsePageParam("-5")).toBe(1);
      expect(parsePageParam("2.5")).toBe(1);
      expect(parsePageParam("abc")).toBe(1);
    });
  });

  describe("buildPageUrl", () => {
    it("appends page param when no query params exist", () => {
      expect(buildPageUrl("/workspace/applications", null, 2)).toBe(
        "/workspace/applications?page=2",
      );
    });

    it("preserves unrelated query parameters and updates page", () => {
      const existing = new URLSearchParams("tab=drafts&page=1&org=abc");
      expect(buildPageUrl("/workspace/applications", existing, 4)).toBe(
        "/workspace/applications?tab=drafts&page=4&org=abc",
      );
    });
  });
});

describe("PaginatedTable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue("/workspace/applications");
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("includes the exact required last-page notice string in English i18n messages", () => {
    expect(messages.PaginatedTable.lastPageNotice).toBe(
      "The results have changed since this link was created. You’re now viewing the last available page.",
    );
  });

  it("starts on page 1 when no search parameters are present and renders responsive table with pagination", async () => {
    const fetchPage = jest
      .fn<Promise<PaginatedTableResponse<DemoItem>>, [number]>()
      .mockImplementation((page) =>
        Promise.resolve(createPageResponse(page, 3)),
      );

    render(
      <PaginatedTable
        fetchPage={fetchPage}
        headerContent={demoHeaders}
        mapRow={mapDemoRow}
        getRowKey={(item) => item.id}
        errorMessage="Unable to load applications."
        emptyState={<div>No applications found.</div>}
        renderSummary={(info) => (
          <div data-testid="summary">{info.total_records} total records</div>
        )}
      />,
    );

    expect(fetchPage).toHaveBeenCalledWith(1);
    expect(await screen.findByText("Grant Application 1")).toBeInTheDocument();
    expect(screen.getByText("Grant Application 2")).toBeInTheDocument();
    expect(screen.getByTestId("summary")).toHaveTextContent("6 total records");
    expect(
      screen.getByRole("navigation", { name: /pagination/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Page 1" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("respects the page query parameter in the URL on initial load", async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("page=3"));
    const fetchPage = jest
      .fn<Promise<PaginatedTableResponse<DemoItem>>, [number]>()
      .mockImplementation((page) =>
        Promise.resolve(createPageResponse(page, 5)),
      );

    render(
      <PaginatedTable
        fetchPage={fetchPage}
        headerContent={demoHeaders}
        mapRow={mapDemoRow}
        errorMessage="Error"
        emptyState={<div>Empty</div>}
      />,
    );

    expect(fetchPage).toHaveBeenCalledWith(3);
    expect(await screen.findByText("Grant Application 5")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Page 3" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("uses initialPage when no URL page query param is present", async () => {
    const fetchPage = jest
      .fn<Promise<PaginatedTableResponse<DemoItem>>, [number]>()
      .mockImplementation((page) =>
        Promise.resolve(createPageResponse(page, 5)),
      );

    render(
      <PaginatedTable
        fetchPage={fetchPage}
        headerContent={demoHeaders}
        mapRow={mapDemoRow}
        initialPage={2}
        errorMessage="Error"
        emptyState={<div>Empty</div>}
      />,
    );

    expect(fetchPage).toHaveBeenCalledWith(2);
    expect(await screen.findByText("Grant Application 3")).toBeInTheDocument();
  });

  it("displays single-page pagination UI when only one page is available", async () => {
    const fetchPage = jest
      .fn<Promise<PaginatedTableResponse<DemoItem>>, [number]>()
      .mockResolvedValue(createPageResponse(1, 1));

    render(
      <PaginatedTable
        fetchPage={fetchPage}
        headerContent={demoHeaders}
        mapRow={mapDemoRow}
        errorMessage="Error"
        emptyState={<div>Empty</div>}
      />,
    );

    expect(await screen.findByText("Grant Application 1")).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: /pagination/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /page 1/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /next page/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /previous page/i }),
    ).not.toBeInTheDocument();
  });

  it("renders 7 pagination slots with overflow and navigation arrows when there are many pages", async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("page=6"));
    const fetchPage = jest
      .fn<Promise<PaginatedTableResponse<DemoItem>>, [number]>()
      .mockImplementation((page) =>
        Promise.resolve(createPageResponse(page, 12)),
      );

    render(
      <PaginatedTable
        fetchPage={fetchPage}
        headerContent={demoHeaders}
        mapRow={mapDemoRow}
        errorMessage="Error"
        emptyState={<div>Empty</div>}
      />,
    );

    expect(await screen.findByText("Grant Application 11")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /previous page/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /next page/i }),
    ).toBeInTheDocument();

    // USWDS 7 slots on page 6 of 12: [Prev, 1, ..., 5, 6, 7, ..., 12, Next]
    // -> 9 total listitems (2 arrows + 7 pagination slots) and 7 buttons (2 arrows + 5 page buttons)
    const nav = screen.getByRole("navigation", { name: /pagination/i });
    expect(within(nav).getAllByRole("listitem")).toHaveLength(9);
    expect(within(nav).getAllByRole("button")).toHaveLength(7);
  });

  it("navigates across pages via Next, Previous, and page number buttons while syncing URL query params", async () => {
    const user = userEvent.setup();
    mockUseSearchParams.mockReturnValue(new URLSearchParams("filter=active"));

    const fetchPage = jest
      .fn<Promise<PaginatedTableResponse<DemoItem>>, [number]>()
      .mockImplementation((page) =>
        Promise.resolve(createPageResponse(page, 4)),
      );

    render(
      <PaginatedTable
        fetchPage={fetchPage}
        headerContent={demoHeaders}
        mapRow={mapDemoRow}
        errorMessage="Error"
        emptyState={<div>Empty</div>}
      />,
    );

    expect(await screen.findByText("Grant Application 1")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /next page/i }));
    expect(await screen.findByText("Grant Application 3")).toBeInTheDocument();
    expect(fetchPage).toHaveBeenCalledWith(2);
    expect(mockPush).toHaveBeenCalledWith(
      "/workspace/applications?filter=active&page=2",
      { scroll: false },
    );

    await user.click(screen.getByRole("button", { name: "Last page, page 4" }));
    expect(await screen.findByText("Grant Application 7")).toBeInTheDocument();
    expect(fetchPage).toHaveBeenCalledWith(4);
    expect(mockPush).toHaveBeenCalledWith(
      "/workspace/applications?filter=active&page=4",
      { scroll: false },
    );

    await user.click(screen.getByRole("button", { name: /previous page/i }));
    expect(await screen.findByText("Grant Application 5")).toBeInTheDocument();
    expect(fetchPage).toHaveBeenCalledWith(3);
    expect(mockPush).toHaveBeenCalledWith(
      "/workspace/applications?filter=active&page=3",
      { scroll: false },
    );
  });

  it("supports keyboard navigation via Tab and Enter on pagination controls", async () => {
    const user = userEvent.setup();
    const fetchPage = jest
      .fn<Promise<PaginatedTableResponse<DemoItem>>, [number]>()
      .mockImplementation((page) =>
        Promise.resolve(createPageResponse(page, 3)),
      );

    render(
      <PaginatedTable
        fetchPage={fetchPage}
        headerContent={demoHeaders}
        mapRow={mapDemoRow}
        errorMessage="Error"
        emptyState={<div>Empty</div>}
      />,
    );

    expect(await screen.findByText("Grant Application 1")).toBeInTheDocument();

    const page2Button = screen.getByRole("button", { name: "Page 2" });
    page2Button.focus();
    expect(page2Button).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(await screen.findByText("Grant Application 3")).toBeInTheDocument();
    expect(fetchPage).toHaveBeenCalledWith(2);
  });

  it("skips URL updates when syncUrl is false", async () => {
    const user = userEvent.setup();
    const fetchPage = jest
      .fn<Promise<PaginatedTableResponse<DemoItem>>, [number]>()
      .mockImplementation((page) =>
        Promise.resolve(createPageResponse(page, 2)),
      );

    render(
      <PaginatedTable
        fetchPage={fetchPage}
        headerContent={demoHeaders}
        mapRow={mapDemoRow}
        syncUrl={false}
        errorMessage="Error"
        emptyState={<div>Empty</div>}
      />,
    );

    expect(await screen.findByText("Grant Application 1")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /next page/i }));
    expect(await screen.findByText("Grant Application 3")).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("renders custom emptyState in place of table and hides pagination when no data is returned", async () => {
    const fetchPage = jest
      .fn<Promise<PaginatedTableResponse<DemoItem>>, [number]>()
      .mockResolvedValue(createPageResponse(1, 0, 2, 0));

    render(
      <PaginatedTable
        fetchPage={fetchPage}
        headerContent={demoHeaders}
        mapRow={mapDemoRow}
        errorMessage="Error"
        emptyState={<div>You have not started any applications yet.</div>}
      />,
    );

    expect(
      await screen.findByText("You have not started any applications yet."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: /pagination/i }),
    ).not.toBeInTheDocument();
  });

  it("renders custom errorMessage in an error alert in place of the table when fetching fails", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const onError = jest.fn();
    const fetchPage = jest
      .fn<Promise<PaginatedTableResponse<DemoItem>>, [number]>()
      .mockRejectedValue(new Error("API unavailable"));

    render(
      <PaginatedTable
        fetchPage={fetchPage}
        headerContent={demoHeaders}
        mapRow={mapDemoRow}
        errorMessage="We encountered an error loading your applications."
        emptyState={<div>Empty</div>}
        onError={onError}
      />,
    );

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "We encountered an error loading your applications.",
    );
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(onError).toHaveBeenCalledTimes(1);

    consoleErrorSpy.mockRestore();
  });

  describe("loading states and slow network resilience (#8334)", () => {
    it("shows initial loading spinner and hides empty state while initial request is pending", async () => {
      const deferred = createDeferred<PaginatedTableResponse<DemoItem>>();
      const fetchPage = jest.fn(() => deferred.promise);

      render(
        <PaginatedTable
          fetchPage={fetchPage}
          headerContent={demoHeaders}
          mapRow={mapDemoRow}
          errorMessage="Error"
          emptyState={<div>Empty</div>}
        />,
      );

      const loadingContainer = screen.getByTestId("paginated-table-loading");
      expect(loadingContainer).toHaveAttribute("role", "status");
      expect(loadingContainer).toHaveAttribute("aria-busy", "true");
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
      expect(screen.queryByText("Empty")).not.toBeInTheDocument();

      deferred.resolve(createPageResponse(1, 2));
      expect(
        await screen.findByText("Grant Application 1"),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId("paginated-table-loading"),
      ).not.toBeInTheDocument();
    });

    it("shows inline loading UI, marks table busy, disables pagination, and ignores clicks during slow page transitions", async () => {
      const user = userEvent.setup();
      const page2Deferred = createDeferred<PaginatedTableResponse<DemoItem>>();

      const fetchPage = jest
        .fn<Promise<PaginatedTableResponse<DemoItem>>, [number]>()
        .mockImplementation((page) => {
          if (page === 1) {
            return Promise.resolve(createPageResponse(1, 4));
          }
          return page2Deferred.promise;
        });

      render(
        <PaginatedTable
          fetchPage={fetchPage}
          headerContent={demoHeaders}
          mapRow={mapDemoRow}
          errorMessage="Error"
          emptyState={<div>Empty</div>}
        />,
      );

      expect(
        await screen.findByText("Grant Application 1"),
      ).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Page 2" }));

      expect(
        screen.getByTestId("paginated-table-loading-indicator"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("paginated-table-content")).toHaveAttribute(
        "aria-busy",
        "true",
      );
      expect(screen.getByTestId("paginated-table-content")).toHaveClass(
        "paginated-table-loading",
      );

      const nav = screen.getByRole("navigation", { name: /pagination/i });
      expect(nav).toHaveAttribute("aria-disabled", "true");
      expect(nav).toHaveClass("disabled");

      // Attempt to click another page while loading: should be ignored
      await user.click(screen.getByRole("button", { name: "Page 3" }));
      expect(fetchPage).toHaveBeenCalledTimes(2);
      expect(fetchPage).not.toHaveBeenCalledWith(3);

      page2Deferred.resolve(createPageResponse(2, 4));
      expect(
        await screen.findByText("Grant Application 3"),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId("paginated-table-loading-indicator"),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("paginated-table-content")).toHaveAttribute(
        "aria-busy",
        "false",
      );
      expect(nav).toHaveAttribute("aria-disabled", "false");
    });

    it("transitions cleanly from slow page loading to error alert when a subsequent page fails", async () => {
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const user = userEvent.setup();
      const page2Deferred = createDeferred<PaginatedTableResponse<DemoItem>>();

      const fetchPage = jest
        .fn<Promise<PaginatedTableResponse<DemoItem>>, [number]>()
        .mockImplementation((page) => {
          if (page === 1) {
            return Promise.resolve(createPageResponse(1, 3));
          }
          return page2Deferred.promise;
        });

      render(
        <PaginatedTable
          fetchPage={fetchPage}
          headerContent={demoHeaders}
          mapRow={mapDemoRow}
          errorMessage="Slow request timed out."
          emptyState={<div>Empty</div>}
        />,
      );

      expect(
        await screen.findByText("Grant Application 1"),
      ).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Page 2" }));
      expect(
        screen.getByTestId("paginated-table-loading-indicator"),
      ).toBeInTheDocument();

      page2Deferred.reject(new Error("Gateway Timeout"));

      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent("Slow request timed out.");
      expect(screen.queryByRole("table")).not.toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });

    it("discards stale out-of-order responses when a newer request resolves first", async () => {
      const firstDeferred = createDeferred<PaginatedTableResponse<DemoItem>>();
      const secondDeferred = createDeferred<PaginatedTableResponse<DemoItem>>();

      let callCount = 0;
      const fetchPage = jest.fn(() => {
        callCount += 1;
        return callCount === 1 ? firstDeferred.promise : secondDeferred.promise;
      });

      const { rerender } = render(
        <PaginatedTable
          fetchPage={fetchPage}
          headerContent={demoHeaders}
          mapRow={mapDemoRow}
          refreshKey={1}
          errorMessage="Error"
          emptyState={<div>Empty</div>}
        />,
      );

      // Trigger a newer request before the first request finishes
      rerender(
        <PaginatedTable
          fetchPage={fetchPage}
          headerContent={demoHeaders}
          mapRow={mapDemoRow}
          refreshKey={2}
          errorMessage="Error"
          emptyState={<div>Empty</div>}
        />,
      );

      // Newer response resolves first
      secondDeferred.resolve({
        data: [{ id: "fresh", name: "Fresh Record", status: "Submitted" }],
        paginationInfo: {
          page_offset: 1,
          page_size: 2,
          total_pages: 1,
          total_records: 1,
        },
      });
      expect(await screen.findByText("Fresh Record")).toBeInTheDocument();

      // Stale earlier response resolves afterwards and must be ignored
      firstDeferred.resolve({
        data: [{ id: "stale", name: "Stale Record", status: "Draft" }],
        paginationInfo: {
          page_offset: 1,
          page_size: 2,
          total_pages: 1,
          total_records: 1,
        },
      });

      await waitFor(() => {
        expect(screen.getByText("Fresh Record")).toBeInTheDocument();
      });
      expect(screen.queryByText("Stale Record")).not.toBeInTheDocument();
    });
  });

  describe("last-page recovery (#8335)", () => {
    it("detects out-of-range page, fetches last available page, updates URL with replace, and shows notice", async () => {
      mockUseSearchParams.mockReturnValue(
        new URLSearchParams("org=123&page=10"),
      );

      const fetchPage = jest
        .fn<Promise<PaginatedTableResponse<DemoItem>>, [number]>()
        .mockImplementation((page) =>
          Promise.resolve(createPageResponse(page, 3)),
        );

      render(
        <PaginatedTable
          fetchPage={fetchPage}
          headerContent={demoHeaders}
          mapRow={mapDemoRow}
          errorMessage="Error"
          emptyState={<div>Empty</div>}
        />,
      );

      // First calls requested page 10, then recovers by fetching last page (3)
      expect(
        await screen.findByText("Grant Application 5"),
      ).toBeInTheDocument();
      expect(fetchPage).toHaveBeenNthCalledWith(1, 10);
      expect(fetchPage).toHaveBeenNthCalledWith(2, 3);
      expect(mockReplace).toHaveBeenCalledWith(
        "/workspace/applications?org=123&page=3",
        { scroll: false },
      );

      const notice = screen.getByTestId("paginated-table-last-page-notice");
      expect(notice).toBeInTheDocument();
      // Next-intl mock returns translation key "lastPageNotice"
      expect(notice).toHaveTextContent("lastPageNotice");
      expect(
        screen.getByRole("button", { name: "Last page, page 3" }),
      ).toHaveAttribute("aria-current", "page");
    });

    it("clears the last-page notice once the user navigates to another page", async () => {
      const user = userEvent.setup();
      mockUseSearchParams.mockReturnValue(new URLSearchParams("page=8"));

      const fetchPage = jest
        .fn<Promise<PaginatedTableResponse<DemoItem>>, [number]>()
        .mockImplementation((page) =>
          Promise.resolve(createPageResponse(page, 3)),
        );

      render(
        <PaginatedTable
          fetchPage={fetchPage}
          headerContent={demoHeaders}
          mapRow={mapDemoRow}
          lastPageNoticeMessage="The results have changed since this link was created. You’re now viewing the last available page."
          errorMessage="Error"
          emptyState={<div>Empty</div>}
        />,
      );

      expect(
        await screen.findByText(
          "The results have changed since this link was created. You’re now viewing the last available page.",
        ),
      ).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /previous page/i }));
      expect(
        await screen.findByText("Grant Application 3"),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId("paginated-table-last-page-notice"),
      ).not.toBeInTheDocument();
    });
  });

  describe("SSR initialData and external URL sync", () => {
    it("renders initialData immediately without an extra mount fetch", () => {
      const fetchPage = jest.fn<
        Promise<PaginatedTableResponse<DemoItem>>,
        [number]
      >();

      render(
        <PaginatedTable
          fetchPage={fetchPage}
          headerContent={demoHeaders}
          mapRow={mapDemoRow}
          initialData={createPageResponse(1, 3)}
          errorMessage="Error"
          emptyState={<div>Empty</div>}
        />,
      );

      expect(screen.getByText("Grant Application 1")).toBeInTheDocument();
      expect(fetchPage).not.toHaveBeenCalled();
    });

    it("syncs when URL searchParams change externally (browser back/forward)", async () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams("page=1"));
      const fetchPage = jest
        .fn<Promise<PaginatedTableResponse<DemoItem>>, [number]>()
        .mockImplementation((page) =>
          Promise.resolve(createPageResponse(page, 4)),
        );

      const { rerender } = render(
        <PaginatedTable
          fetchPage={fetchPage}
          headerContent={demoHeaders}
          mapRow={mapDemoRow}
          errorMessage="Error"
          emptyState={<div>Empty</div>}
        />,
      );

      expect(
        await screen.findByText("Grant Application 1"),
      ).toBeInTheDocument();

      mockUseSearchParams.mockReturnValue(new URLSearchParams("page=3"));
      rerender(
        <PaginatedTable
          fetchPage={fetchPage}
          headerContent={demoHeaders}
          mapRow={mapDemoRow}
          errorMessage="Error"
          emptyState={<div>Empty</div>}
        />,
      );

      expect(
        await screen.findByText("Grant Application 5"),
      ).toBeInTheDocument();
      expect(fetchPage).toHaveBeenCalledWith(3);
    });
  });

  describe("accessibility (jest-axe)", () => {
    const axeOptions = {
      rules: {
        // USWDS Pagination icons/list structure follow SearchPagination.test.tsx conventions
        "svg-img-alt": { enabled: false },
      },
    };

    it("has no accessibility violations in loaded multi-page state", async () => {
      const fetchPage = jest
        .fn<Promise<PaginatedTableResponse<DemoItem>>, [number]>()
        .mockResolvedValue(createPageResponse(1, 5));

      const { container } = render(
        <PaginatedTable
          fetchPage={fetchPage}
          headerContent={demoHeaders}
          mapRow={mapDemoRow}
          errorMessage="Error"
          emptyState={<div>Empty</div>}
        />,
      );

      await screen.findByText("Grant Application 1");
      const results = await axe(container, axeOptions);
      expect(results).toHaveNoViolations();
    });

    it("has no accessibility violations in loading state", async () => {
      const deferred = createDeferred<PaginatedTableResponse<DemoItem>>();
      const { container } = render(
        <PaginatedTable
          fetchPage={() => deferred.promise}
          headerContent={demoHeaders}
          mapRow={mapDemoRow}
          errorMessage="Error"
          emptyState={<div>Empty</div>}
        />,
      );

      const results = await axe(container, axeOptions);
      expect(results).toHaveNoViolations();
    });

    it("has no accessibility violations in error state", async () => {
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const fetchPage = jest.fn(() => Promise.reject(new Error("Boom")));

      const { container } = render(
        <PaginatedTable
          fetchPage={fetchPage}
          headerContent={demoHeaders}
          mapRow={mapDemoRow}
          errorMessage="Something went wrong."
          emptyState={<div>Empty</div>}
        />,
      );

      await screen.findByRole("alert");
      const results = await axe(container, axeOptions);
      expect(results).toHaveNoViolations();
      consoleErrorSpy.mockRestore();
    });

    it("has no accessibility violations in last-page recovery state", async () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams("page=9"));
      const fetchPage = jest
        .fn<Promise<PaginatedTableResponse<DemoItem>>, [number]>()
        .mockImplementation((page) =>
          Promise.resolve(createPageResponse(page, 2)),
        );

      const { container } = render(
        <PaginatedTable
          fetchPage={fetchPage}
          headerContent={demoHeaders}
          mapRow={mapDemoRow}
          errorMessage="Error"
          emptyState={<div>Empty</div>}
        />,
      );

      await screen.findByTestId("paginated-table-last-page-notice");
      const results = await axe(container, axeOptions);
      expect(results).toHaveNoViolations();
    });
  });
});
