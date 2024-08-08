/* eslint-disable jest/no-commented-out-tests */
import "@testing-library/jest-dom/extend-expect";
import { axe } from "jest-axe";
import { render } from "tests/react-utils";
import React from "react";
import SearchPagination from "src/components/search/SearchPagination";

const mockUpdateQueryParams = jest.fn();

jest.mock("src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    updateQueryParams: mockUpdateQueryParams,
  }),
}));

// import SearchPagination, {
//   PaginationPosition,
// } from "../../../src/components/search/SearchPagination";

// import { render } from "@testing-library/react";

// TODO (Issue #1936): Uncomment tests after React 19 upgrade
describe("SearchPagination", () => {
  it("pass test", () => {
    expect(1).toBe(1);
  });
  it("should not have basic accessibility issues", async () => {
    const { container } = render(<SearchPagination page={1} query={"test"} />);

    const results = await axe(container, {
      rules: {
        // Disable specific rules that are known to fail due to third-party components
        list: { enabled: false },
        "svg-img-alt": { enabled: false },
      },
    });
    expect(results).toHaveNoViolations();
  });

  //   it("renders hidden input when showHiddenInput is true", () => {
  //     render(
  //       <SearchPagination
  //         showHiddenInput={true}
  //         totalPages={totalPages}
  //         page={page}
  //         handlePageChange={mockHandlePageChange}
  //         position={PaginationPosition.Top}
  //       />,
  //     );

  //     const hiddenInput = screen.getByTestId("hiddenCurrentPage");
  //     expect(hiddenInput).toHaveValue("1");
  //   });

  //   it("does not render hidden input when showHiddenInput is false", () => {
  //     render(
  //       <SearchPagination
  //         showHiddenInput={false}
  //         totalPages={totalPages}
  //         page={page}
  //         handlePageChange={mockHandlePageChange}
  //         position={PaginationPosition.Top}
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
  //         position={PaginationPosition.Top}
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
  //         position={PaginationPosition.Top}
  //       />,
  //     );
  //     fireEvent.click(screen.getByLabelText("Previous page"));
  //     expect(mockHandlePageChange).toHaveBeenCalledWith(1);
  //   });

  //   it("returns null when searchResultsLength is less than 1", () => {
  //     const { container } = render(
  //       <SearchPagination
  //         showHiddenInput={true}
  //         page={page}
  //         handlePageChange={mockHandlePageChange}
  //         searchResultsLength={0} // No results, pagination should be hidden
  //         position={PaginationPosition.Top}
  //       />,
  //     );
  //     expect(container).toBeEmptyDOMElement();
  //   });
});
