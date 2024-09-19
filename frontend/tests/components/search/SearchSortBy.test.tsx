import { fireEvent } from "@testing-library/react";
import { axe } from "jest-axe";
import QueryProvider from "src/app/[locale]/search/QueryProvider";
import { render, screen } from "tests/react-utils";

import React from "react";

import SearchSortBy from "src/components/search/SearchSortBy";

// Mock the useSearchParamUpdater hook
jest.mock("src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    updateQueryParams: jest.fn(),
  }),
}));

describe("SearchSortBy", () => {
  it("should not have basic accessibility issues", async () => {
    const { container } = render(
      <SearchSortBy
        totalResults={"10"}
        queryTerm="test"
        sortby="closeDateDesc"
      />,
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("renders correctly with initial query params", () => {
    render(<SearchSortBy totalResults={"10"} queryTerm="test" sortby="" />);

    expect(
      screen.getByDisplayValue("Posted Date (newest)"),
    ).toBeInTheDocument();
  });

  it("updates sort option and submits the form on change", () => {
    render(
      <QueryProvider>
        <SearchSortBy totalResults={"10"} queryTerm="test" sortby="" />
      </QueryProvider>,
    );

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "opportunityTitleDesc" },
    });

    expect(screen.getByText("Opportunity Title (Z to A)")).toBeInTheDocument();
  });
});
