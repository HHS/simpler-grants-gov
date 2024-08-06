import { axe } from "jest-axe";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import SearchSortBy from "src/components/search/SearchSortBy";
import QueryProvider from "src/app/[locale]/search/QueryProvider";

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
