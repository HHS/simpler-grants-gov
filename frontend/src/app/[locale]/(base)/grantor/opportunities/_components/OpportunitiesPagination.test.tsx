import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import React from "react";

import "@testing-library/jest-dom";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import OpportunitiesPagination from "./OpportunitiesPagination";

// 1. Mock Next.js Navigation Hooks
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));

describe("OpportunitiesPagination Component", () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up standard mock returns for standard Next.js behavior
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (usePathname as jest.Mock).mockReturnValue("/products");

    // Simulate query parameters using modern URLSearchParams string setups
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => (key === "page" ? "2" : null),
      toString: () => "page=2",
    });
  });

  it("renders the USWDS pagination element with the correct active page number", () => {
    render(<OpportunitiesPagination totalPages={5} />);

    // Verify page buttons exist
    expect(
      screen.getByRole("navigation", { name: /pagination/i }),
    ).toBeInTheDocument();

    // Page '2' button should be present
    const activePageButton = screen.getByRole("button", { name: /page 2/i });
    expect(activePageButton).toBeInTheDocument();
  });

  it("executes the Server Action and pushes the correct URL parameter on next page click", async () => {
    // Override standard setup mock to start cleanly on Page 1
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => (key === "page" ? "1" : null),
      toString: () => "page=1",
    });

    render(<OpportunitiesPagination totalPages={5} />);

    // Target the "Next" navigation item
    const nextButton = screen.getByRole("button", { name: /next page/i });
    fireEvent.click(nextButton);

    // Wait for the async React transition hook to execute the router update
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/products?page=2");
    });
  });

  it("hides the previous button when current page is page 1", () => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => (key === "page" ? "1" : null),
      toString: () => "page=1",
    });

    render(<OpportunitiesPagination totalPages={5} />);

    // 1. Fetch all button elements currently rendered inside the component
    const allButtons = screen.queryAllByRole("button");

    // 2. Scan the active list to ensure no "previous" controller exists
    const hasPreviousButton = allButtons.some((button) => {
      const ariaLabel = button.getAttribute("aria-label") || "";
      const textContent = button.textContent || "";

      return (
        ariaLabel.toLowerCase().includes("previous page") ||
        textContent.toLowerCase().includes("previous page")
      );
    });

    // 3. Assert that the button is completely hidden from the DOM
    expect(hasPreviousButton).toBe(false);
  });

  it("hides the next button when current page equals total pages", () => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => (key === "page" ? "5" : null),
      toString: () => "page=5",
    });

    render(<OpportunitiesPagination totalPages={5} />);

    // 1. Fetch all button elements currently rendered inside the component
    const allButtons = screen.queryAllByRole("button");

    // 2. Scan the active list to ensure no "previous" controller exists
    const hasPreviousButton = allButtons.some((button) => {
      const ariaLabel = button.getAttribute("aria-label") || "";
      const textContent = button.textContent || "";

      return (
        ariaLabel.toLowerCase().includes("next page") ||
        textContent.toLowerCase().includes("next page")
      );
    });

    // 3. Assert that the button is completely hidden from the DOM
    expect(hasPreviousButton).toBe(false);
  });
});
