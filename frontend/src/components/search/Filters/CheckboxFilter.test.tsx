import { fireEvent } from "@testing-library/react";
import { axe } from "jest-axe";
import { initialFilterOptions } from "src/utils/testing/fixtures";
import { render, screen } from "tests/react-utils";

import React from "react";

import { CheckboxFilter } from "src/components/search/Filters/CheckboxFilter";

const fakeFacetCounts = {
  grant: 1,
  other: 1,
  procurement_contract: 1,
  cooperative_agreement: 1,
};

const mockUpdateQueryParams = jest.fn();

jest.mock("src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    updateQueryParams: mockUpdateQueryParams,
  }),
}));

describe("CheckboxFilter", () => {
  const title = "Test Accordion";
  const queryParamKey = "fundingInstrument";

  it("should not have basic accessibility issues", async () => {
    const { container } = render(
      <CheckboxFilter
        filterOptions={initialFilterOptions}
        title={title}
        queryParamKey={queryParamKey}
        query={new Set()}
        facetCounts={fakeFacetCounts}
      />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("displays the correct checkbox labels", () => {
    render(
      <CheckboxFilter
        filterOptions={initialFilterOptions}
        title={title}
        queryParamKey={queryParamKey}
        query={new Set()}
        facetCounts={fakeFacetCounts}
      />,
    );

    expect(screen.getByText("Cooperative Agreement")).toBeInTheDocument();
    expect(screen.getByText("Grant")).toBeInTheDocument();
    expect(screen.getByText("Procurement Contract")).toBeInTheDocument();
    expect(screen.getByText("Other")).toBeInTheDocument();
  });

  it("updates heading background color when options are selected", () => {
    const { rerender } = render(
      <CheckboxFilter
        filterOptions={initialFilterOptions}
        title={title}
        queryParamKey={queryParamKey}
        query={new Set("")}
        facetCounts={fakeFacetCounts}
      />,
    );

    const updatedQuery = new Set("");
    updatedQuery.add("Cooperative Agreement");
    updatedQuery.add("Grant");

    rerender(
      <CheckboxFilter
        filterOptions={initialFilterOptions}
        title={title}
        queryParamKey={queryParamKey}
        query={updatedQuery}
        facetCounts={fakeFacetCounts}
      />,
    );

    // Verify the background updates after selecting options
    // actual checkbox state is tested elsewhere
    const titleHeading = screen.getByRole("heading");
    expect(titleHeading).toHaveClass("simpler-selected-filter");
  });
  it("adds an any option checkbox by default", () => {
    render(
      <CheckboxFilter
        filterOptions={initialFilterOptions}
        title={title}
        queryParamKey={queryParamKey}
        query={new Set("")}
        facetCounts={fakeFacetCounts}
      />,
    );
    const accordionToggleButton = screen.getByRole("button");
    fireEvent.click(accordionToggleButton);
    const anyCheckbox = screen.getByRole("checkbox", {
      name: "Any test accordion",
    });
    expect(anyCheckbox).toBeInTheDocument();
  });

  it("should be expanded by default if there are selected options", () => {
    render(
      <CheckboxFilter
        filterOptions={initialFilterOptions}
        title={title}
        queryParamKey={queryParamKey}
        query={new Set("Cooperative Agreement")}
        facetCounts={fakeFacetCounts}
        includeAnyOption={false}
      />,
    );

    const checkbox = screen.getByText("Cooperative Agreement");

    expect(checkbox).toBeVisible();
  });

  it("should not be expanded by default if there no are selected options", () => {
    render(
      <CheckboxFilter
        filterOptions={initialFilterOptions}
        title={title}
        queryParamKey={queryParamKey}
        query={new Set()}
        facetCounts={fakeFacetCounts}
        includeAnyOption={false}
      />,
    );

    const checkbox = screen.queryByText("Cooperative Agreement");

    expect(checkbox).not.toBeVisible();
  });
});
