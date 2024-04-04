import { render, screen } from "@testing-library/react";

import React from "react";
import SearchResultsHeader from "../../../src/components/search/SearchResultsHeader";
import { axe } from "jest-axe";

// Mock the SearchSortBy component
jest.mock("../../../src/components/search/SearchSortBy", () => {
  return {
    __esModule: true,
    default: () => <div>Mock SearchSortBy</div>,
  };
});

describe("SearchResultsHeader", () => {
  const initialQueryParams = "";
  const formRef = React.createRef<HTMLFormElement>();

  it("should not have basic accessibility issues", async () => {
    const searchResultsLength = 100;
    const { container } = render(
      <SearchResultsHeader
        searchResultsLength={searchResultsLength}
        formRef={formRef}
        initialQueryParams={initialQueryParams}
      />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders correctly and displays the number of opportunities", () => {
    const searchResultsLength = 100;
    render(
      <SearchResultsHeader
        searchResultsLength={searchResultsLength}
        formRef={formRef}
        initialQueryParams={initialQueryParams}
      />,
    );

    expect(screen.getByText("100 Opportunities")).toBeInTheDocument();
    expect(screen.getByText("Mock SearchSortBy")).toBeInTheDocument();
  });
});
