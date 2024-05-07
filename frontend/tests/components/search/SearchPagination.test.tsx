import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";

import React from "react";
import SearchPagination from "../../../src/components/search/SearchPagination";
import { axe } from "jest-axe";

describe("SearchPagination", () => {
  const mockHandlePageChange = jest.fn();
  const page = 1;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not have basic accessibility issues", async () => {
    const { container } = render(
      <SearchPagination
        showHiddenInput={true}
        page={page}
        handlePageChange={mockHandlePageChange}
      />,
    );
    const results = await axe(container, {
      rules: {
        // Disable specific rules that are known to fail due to third-party components
        list: { enabled: false },
        "svg-img-alt": { enabled: false },
      },
    });
    expect(results).toHaveNoViolations();
  });

  it("renders hidden input when showHiddenInput is true", () => {
    render(
      <SearchPagination
        showHiddenInput={true}
        page={page}
        handlePageChange={mockHandlePageChange}
      />,
    );

    const hiddenInput = screen.getByTestId("hiddenCurrentPage");
    expect(hiddenInput).toHaveValue("1");
  });

  it("does not render hidden input when showHiddenInput is false", () => {
    render(
      <SearchPagination
        showHiddenInput={false}
        page={page}
        handlePageChange={mockHandlePageChange}
      />,
    );
    expect(screen.queryByTestId("hiddenCurrentPage")).not.toBeInTheDocument();
  });

  it("calls handlePageChange with next page on next button click", () => {
    render(
      <SearchPagination
        showHiddenInput={true}
        page={page}
        handlePageChange={mockHandlePageChange}
      />,
    );
    fireEvent.click(screen.getByLabelText("Next page"));
    expect(mockHandlePageChange).toHaveBeenCalledWith(page + 1);
  });

  it("calls handlePageChange with previous page on previous button click", () => {
    render(
      <SearchPagination
        showHiddenInput={true}
        page={2} // Set to second page to test going back to first page
        handlePageChange={mockHandlePageChange}
      />,
    );
    fireEvent.click(screen.getByLabelText("Previous page"));
    expect(mockHandlePageChange).toHaveBeenCalledWith(1);
  });
});
