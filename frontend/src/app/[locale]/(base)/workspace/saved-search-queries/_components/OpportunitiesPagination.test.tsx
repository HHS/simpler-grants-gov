import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import OpportunitiesPagination from "./OpportunitiesPagination";

const mockUsePathname = jest.fn();
const mockUseSearchParams = jest.fn();
const mockUseRouter = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => mockUseRouter() as unknown,
  useSearchParams: () => mockUseSearchParams() as unknown,
  usePathname: () => mockUsePathname() as unknown,
}));

describe("OpportunitiesPagination Component", () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseRouter.mockReturnValue({ push: mockPush });
    mockUsePathname.mockReturnValue("/products");
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => (key === "page" ? "2" : null),
      toString: () => "page=2",
    });
  });

  it("renders the USWDS pagination element with the correct active page number", () => {
    render(<OpportunitiesPagination totalPages={5} />);

    expect(
      screen.getByRole("navigation", { name: /pagination/i }),
    ).toBeInTheDocument();

    const activePageButton = screen.getByRole("button", { name: /page 2/i });
    expect(activePageButton).toBeInTheDocument();
  });

  it("executes the Server Action and pushes the correct URL parameter on next page click", async () => {
    // Override standard setup mock to start cleanly on Page 1
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => (key === "page" ? "1" : null),
      toString: () => "page=1",
    });

    render(<OpportunitiesPagination totalPages={5} />);

    const nextButton = screen.getByRole("button", { name: /next page/i });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/products?page=2");
    });
  });

  it("hides the previous button when current page is page 1", () => {
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => (key === "page" ? "1" : null),
      toString: () => "page=1",
    });

    render(<OpportunitiesPagination totalPages={5} />);

    const allButtons = screen.queryAllByRole("button");

    const hasPreviousButton = allButtons.some((button) => {
      const ariaLabel = button.getAttribute("aria-label") || "";
      const textContent = button.textContent || "";

      return (
        ariaLabel.toLowerCase().includes("previous page") ||
        textContent.toLowerCase().includes("previous page")
      );
    });

    expect(hasPreviousButton).toBe(false);
  });

  it("hides the next button when current page equals total pages", () => {
    mockUseSearchParams.mockReturnValue({
      get: (key: string) => (key === "page" ? "5" : null),
      toString: () => "page=5",
    });

    render(<OpportunitiesPagination totalPages={5} />);

    const allButtons = screen.queryAllByRole("button");

    const hasPreviousButton = allButtons.some((button) => {
      const ariaLabel = button.getAttribute("aria-label") || "";
      const textContent = button.textContent || "";

      return (
        ariaLabel.toLowerCase().includes("next page") ||
        textContent.toLowerCase().includes("next page")
      );
    });

    expect(hasPreviousButton).toBe(false);
  });
});
