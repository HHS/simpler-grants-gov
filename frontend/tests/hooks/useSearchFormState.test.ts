import { ConvertedSearchParams } from "../../src/types/requestURLTypes";
import ReactDOM from "react-dom";
// import ReactDOM from "react-dom";
import { SearchAPIResponse } from "../../src/types/search/searchResponseTypes";
import { renderHook } from "@testing-library/react";
import { useSearchFormState } from "../../src/hooks/useSearchFormState";

const mockInitialSearchResults: SearchAPIResponse = {
  message: "Success", // Mock the 'message' property
  status_code: 200, // Mock the 'status_code' property
  pagination_info: {
    page_offset: 1,
    total_pages: 7,
    total_records: 130,
    order_by: "opportunity_id",
    page_size: 25,
    sort_direction: "ascending",
  },
  data: [],
};

jest.mock("react-dom", () => {
  const actualReactDOM = jest.requireActual<typeof ReactDOM>("react-dom");
  return {
    ...actualReactDOM,
    useFormState: jest.fn(() => [
      mockInitialSearchResults,
      () => mockInitialSearchResults,
    ]),
  };
});
describe("useSearchFormState", () => {
  const mockRequestURLQueryParams: ConvertedSearchParams = {
    status: "open",
    query: "",
    sortby: "date",
    page: 1,
    agency: "NASA",
    fundingInstrument: "grant",
  };

  it("initializes with the correct search results", () => {
    const { result } = renderHook(() =>
      useSearchFormState(mockInitialSearchResults, mockRequestURLQueryParams),
    );

    expect(result.current.searchResults).toEqual(mockInitialSearchResults);
  });

  it("initializes with no pagination error", () => {
    const { result } = renderHook(() =>
      useSearchFormState(mockInitialSearchResults, mockRequestURLQueryParams),
    );

    expect(result.current.maxPaginationError).toBe(false);
  });

  // TODO: Fix max pagination error test

  /* eslint-disable jest/no-commented-out-tests */

  //   it("updates the query params and checks for pagination error when new params are passed", () => {
  //     const newQueryParams: ConvertedSearchParams = {
  //       status: "open",
  //       query: "",
  //       sortby: "date",
  //       page: 11,
  //       agency: "NASA",
  //       fundingInstrument: "grant",
  //     };

  //     const newSearchResults = {
  //       ...mockInitialSearchResults,
  //       pagination_info: {
  //         ...mockInitialSearchResults.pagination_info,
  //         page_offset: 11,
  //       },
  //     };

  //     const { result } = renderHook(() =>
  //       useSearchFormState(newSearchResults, newQueryParams),
  //     );
  //     expect(result.current.maxPaginationError).toBe(true);
  //   });
});
