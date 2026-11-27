import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import { PaginatedTableClientShell } from "src/components/core/paginatedTable/PaginatedTableClientShell";

const mockPush = jest.fn();
const mockUsePathname = jest.fn();
const mockUseSearchParams = jest.fn();
const mockIsPending = jest.fn();
const mockStartTransition = jest.fn((callback: () => void) => callback());
// jsdom does not implement scrollIntoView
const mockScrollIntoView = jest.fn();
Element.prototype.scrollIntoView = mockScrollIntoView;

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockUsePathname() as unknown,
  useSearchParams: () => mockUseSearchParams() as unknown,
}));

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  useTransition: (): [boolean, typeof mockStartTransition] => [
    mockIsPending() as boolean,
    mockStartTransition,
  ],
}));

const renderShell = (
  props: Partial<Parameters<typeof PaginatedTableClientShell>[0]> = {},
) =>
  render(
    <PaginatedTableClientShell page={1} totalPages={1} {...props}>
      <table>
        <tbody>
          <tr>
            <td>table content</td>
          </tr>
        </tbody>
      </table>
    </PaginatedTableClientShell>,
  );

describe("PaginatedTableClientShell", () => {
  let replaceStateSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsPending.mockReturnValue(false);
    mockUsePathname.mockReturnValue("/workspace/applications");
    mockUseSearchParams.mockReturnValue(new URLSearchParams("page=1"));
    replaceStateSpy = jest.spyOn(window.history, "replaceState");
  });

  afterEach(() => {
    replaceStateSpy.mockRestore();
  });

  it("renders its children", () => {
    renderShell();
    expect(screen.getByText("table content")).toBeInTheDocument();
  });

  describe("single page", () => {
    it("renders pagination with only one page and no arrows", () => {
      renderShell({ page: 1, totalPages: 1 });

      expect(
        screen.getByRole("navigation", { name: /pagination/i }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /page 1/i })).toHaveAttribute(
        "aria-current",
        "page",
      );
      expect(
        screen.queryByRole("button", { name: /page 2/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /next page/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /previous page/i }),
      ).not.toBeInTheDocument();
    });

    it("does not navigate when the current page is clicked", async () => {
      renderShell({ page: 1, totalPages: 1 });
      await userEvent.click(screen.getByRole("button", { name: /page 1/i }));
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("multiple pages", () => {
    it("shows only a next arrow on the first page", () => {
      renderShell({ page: 1, totalPages: 5 });
      expect(screen.getByRole("button", { name: /next page/i })).toBeVisible();
      expect(
        screen.queryByRole("button", { name: /previous page/i }),
      ).not.toBeInTheDocument();
    });

    it("shows only a previous arrow on the last page", () => {
      renderShell({ page: 5, totalPages: 5 });
      expect(
        screen.getByRole("button", { name: /previous page/i }),
      ).toBeVisible();
      expect(
        screen.queryByRole("button", { name: /next page/i }),
      ).not.toBeInTheDocument();
    });

    it("shows both arrows on a middle page", () => {
      renderShell({ page: 3, totalPages: 5 });
      expect(screen.getByRole("button", { name: /next page/i })).toBeVisible();
      expect(
        screen.getByRole("button", { name: /previous page/i }),
      ).toBeVisible();
    });

    it("limits the number of page slots to 7", () => {
      renderShell({ page: 10, totalPages: 20 });
      // 1 … 9 10 11 … 20
      const pageButtons = screen.getAllByRole("button", { name: /page \d+/i });
      const overflowSlots = screen.getAllByLabelText(
        "ellipsis indicating non-visible pages",
      );
      expect(pageButtons.length + overflowSlots.length).toBe(7);
      expect(screen.getByRole("button", { name: /page 10/i })).toHaveAttribute(
        "aria-current",
        "page",
      );
    });

    it("navigates to the next page, preserving other params, without scrolling", async () => {
      mockUseSearchParams.mockReturnValue(new URLSearchParams("page=2&x=y"));
      renderShell({ page: 2, totalPages: 5 });

      await userEvent.click(screen.getByRole("button", { name: /next page/i }));

      expect(mockStartTransition).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith(
        "/workspace/applications?page=3&x=y",
        { scroll: false },
      );
    });

    it("navigates to the previous page", async () => {
      renderShell({ page: 2, totalPages: 5 });
      await userEvent.click(
        screen.getByRole("button", { name: /previous page/i }),
      );
      expect(mockPush).toHaveBeenCalledWith("/workspace/applications?page=1", {
        scroll: false,
      });
    });

    it("navigates to a clicked page number", async () => {
      renderShell({ page: 1, totalPages: 5 });
      await userEvent.click(screen.getByRole("button", { name: /page 4/i }));
      expect(mockPush).toHaveBeenCalledWith("/workspace/applications?page=4", {
        scroll: false,
      });
    });

    it("moves focus to the top of the table after navigating to a new page", async () => {
      const { rerender } = renderShell({ page: 1, totalPages: 5 });
      await userEvent.click(screen.getByRole("button", { name: /page 2/i }));

      rerender(
        <PaginatedTableClientShell page={2} totalPages={5}>
          <div>page two</div>
        </PaginatedTableClientShell>,
      );

      expect(screen.getByTestId("paginated-table")).toHaveFocus();
      expect(mockScrollIntoView).toHaveBeenCalledWith({ block: "start" });
    });

    it("does not steal focus when the page changes without user navigation", () => {
      const { rerender } = renderShell({ page: 1, totalPages: 5 });
      rerender(
        <PaginatedTableClientShell page={2} totalPages={5}>
          <div>page two</div>
        </PaginatedTableClientShell>,
      );
      expect(screen.getByTestId("paginated-table")).not.toHaveFocus();
      expect(mockScrollIntoView).not.toHaveBeenCalled();
    });
  });

  describe("loading state", () => {
    it("is not loading by default", () => {
      renderShell({ page: 1, totalPages: 5 });
      expect(screen.getByTestId("paginated-table")).toHaveAttribute(
        "aria-busy",
        "false",
      );
      expect(
        screen.queryByTestId("paginated-table-loading"),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("navigation", { name: /pagination/i }),
      ).not.toHaveClass("disabled");
    });

    it("does not show loading if a transition is pending but no page was requested by this table", () => {
      mockIsPending.mockReturnValue(true);
      renderShell({ page: 1, totalPages: 5 });
      expect(
        screen.queryByTestId("paginated-table-loading"),
      ).not.toBeInTheDocument();
    });

    describe("while the next page is loading", () => {
      const startLoadingPage3 = async () => {
        renderShell({ page: 1, totalPages: 5 });
        mockIsPending.mockReturnValue(true);
        await userEvent.click(screen.getByRole("button", { name: /page 3/i }));
      };

      it("marks the table as busy and dims the content", async () => {
        await startLoadingPage3();
        expect(screen.getByTestId("paginated-table")).toHaveAttribute(
          "aria-busy",
          "true",
        );
        expect(screen.getByTestId("paginated-table-content")).toHaveClass(
          "paginated-table__content--loading",
        );
        expect(screen.getByTestId("paginated-table-loading")).toBeVisible();
      });

      it("keeps the current table visible", async () => {
        await startLoadingPage3();
        expect(screen.getByText("table content")).toBeInTheDocument();
      });

      it("disables pagination", async () => {
        await startLoadingPage3();
        const nav = screen.getByRole("navigation", { name: /pagination/i });
        expect(nav).toHaveClass("disabled");
        expect(nav).toHaveAttribute("aria-disabled", "true");
      });

      it("announces the page being loaded to screen readers", async () => {
        await startLoadingPage3();
        expect(screen.getByText("loadingPage")).toHaveClass("usa-sr-only");
      });

      it("ignores further page clicks until loading completes", async () => {
        await startLoadingPage3();
        expect(mockPush).toHaveBeenCalledTimes(1);
        await userEvent.click(screen.getByRole("button", { name: /page 4/i }));
        await userEvent.click(
          screen.getByRole("button", { name: /next page/i }),
        );
        expect(mockPush).toHaveBeenCalledTimes(1);
      });
    });

    it("clears the loading state once the transition finishes", async () => {
      const { rerender } = renderShell({ page: 1, totalPages: 5 });
      mockIsPending.mockReturnValue(true);
      await userEvent.click(screen.getByRole("button", { name: /page 3/i }));
      expect(screen.getByTestId("paginated-table-loading")).toBeVisible();

      mockIsPending.mockReturnValue(false);
      rerender(
        <PaginatedTableClientShell page={3} totalPages={5}>
          <div>page three</div>
        </PaginatedTableClientShell>,
      );
      expect(
        screen.queryByTestId("paginated-table-loading"),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId("paginated-table")).toHaveAttribute(
        "aria-busy",
        "false",
      );
    });
  });

  describe("url sync for last page support", () => {
    it("does not touch the url by default", () => {
      renderShell({ page: 3, totalPages: 3 });
      expect(replaceStateSpy).not.toHaveBeenCalled();
    });

    it("replaces the page param in the url in place when syncUrlToPage is set", () => {
      act(() => {
        window.history.pushState({}, "", "/workspace/applications?page=9&x=1");
      });
      renderShell({ page: 3, totalPages: 3, syncUrlToPage: true });

      expect(replaceStateSpy).toHaveBeenCalledTimes(1);
      expect(replaceStateSpy).toHaveBeenCalledWith(
        expect.anything(),
        "",
        "/workspace/applications?page=3&x=1",
      );
      expect(window.location.search).toBe("?page=3&x=1");
      // a full navigation is not triggered, so any "last page" notice remains visible
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it("passes accessibility scan", async () => {
    const { container } = renderShell({ page: 2, totalPages: 5 });
    expect(await axe(container)).toHaveNoViolations();
  });
});
