import "@testing-library/jest-dom";

import SearchPagination, {
  PaginationType,
} from "../../../src/components/search/SearchPagination";
import { render, screen } from "@testing-library/react";

import React from "react";
import { jest } from "@jest/globals";

jest.mock("react-dom", () => ({
  __esModule: true,
  useFormStatus: jest.fn(() => ({ pending: false })),
}));

describe("SearchPagination", () => {
  const mockHandlePageChange = jest.fn();
  const totalPages = 10;
  const page = 1;
  beforeEach(() => {
    jest.clearAllMocks();
  });

  //   it("should not have basic accessibility issues", async () => {
  //     const { container } = render(
  //       <SearchPagination
  //         showHiddenInput={true}
  //         totalPages={totalPages}
  //         page={page}
  //         handlePageChange={mockHandlePageChange}
  //         position={PaginationType.Top}
  //       />,
  //     );
  //     const results = await axe(container, {
  //       rules: {
  //         // Disable specific rules that are known to fail due to third-party components
  //         list: { enabled: false },
  //         "svg-img-alt": { enabled: false },
  //       },
  //     });
  //     expect(results).toHaveNoViolations();
  //   });

  it("renders hidden input when showHiddenInput is true", () => {
    render(
      <SearchPagination
        showHiddenInput={true}
        totalPages={totalPages}
        page={page}
        handlePageChange={mockHandlePageChange}
        position={PaginationType.Top}
      />,
    );

    const hiddenInput = screen.getByTestId("hiddenCurrentPage");
    expect(hiddenInput).toHaveValue("1");
  });

  //   it("does not render hidden input when showHiddenInput is false", () => {
  //     render(
  //       <SearchPagination
  //         showHiddenInput={false}
  //         totalPages={totalPages}
  //         page={page}
  //         handlePageChange={mockHandlePageChange}
  //         position={PaginationType.Top}
  //       />,
  //     );
  //     expect(screen.queryByTestId("hiddenCurrentPage")).not.toBeInTheDocument();
  //   });

  //   it("calls handlePageChange with next page on next button click", () => {
  //     render(
  //       <SearchPagination
  //         showHiddenInput={true}
  //         totalPages={totalPages}
  //         page={page}
  //         handlePageChange={mockHandlePageChange}
  //         position={PaginationType.Top}
  //       />,
  //     );
  //     fireEvent.click(screen.getByLabelText("Next page"));
  //     expect(mockHandlePageChange).toHaveBeenCalledWith(page + 1);
  //   });

  //   it("calls handlePageChange with previous page on previous button click", () => {
  //     render(
  //       <SearchPagination
  //         showHiddenInput={true}
  //         totalPages={totalPages}
  //         page={2} // Set to second page to test going back to first page
  //         handlePageChange={mockHandlePageChange}
  //         position={PaginationType.Top}
  //       />,
  //     );
  //     fireEvent.click(screen.getByLabelText("Previous page"));
  //     expect(mockHandlePageChange).toHaveBeenCalledWith(1);
  //   });
});
