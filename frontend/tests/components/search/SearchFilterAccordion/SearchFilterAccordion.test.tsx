import "@testing-library/jest-dom/extend-expect";

import { fireEvent } from "@testing-library/react";
import { axe } from "jest-axe";
import { render, screen } from "tests/react-utils";

import React from "react";

import SearchFilterAccordion, {
  FilterOption,
} from "src/components/search/SearchFilterAccordion/SearchFilterAccordion";

const initialFilterOptions: FilterOption[] = [
  {
    id: "funding-instrument-cooperative_agreement",
    label: "Cooperative Agreement",
    value: "cooperative_agreement",
  },
  {
    id: "funding-instrument-grant",
    label: "Grant",
    value: "grant",
  },
  {
    id: "funding-instrument-procurement_contract",
    label: "Procurement Contract ",
    value: "procurement_contract",
  },
  {
    id: "funding-instrument-other",
    label: "Other",
    value: "other",
  },
];

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

describe("SearchFilterAccordion", () => {
  const title = "Test Accordion";
  const queryParamKey = "fundingInstrument";

  it("should not have basic accessibility issues", async () => {
    const { container } = render(
      <SearchFilterAccordion
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
      <SearchFilterAccordion
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

  it("displays select all and clear all correctly", () => {
    const { rerender } = render(
      <SearchFilterAccordion
        filterOptions={initialFilterOptions}
        title={title}
        queryParamKey={queryParamKey}
        query={new Set()}
        facetCounts={fakeFacetCounts}
      />,
    );

    const selectAllButton = screen.getByText("Select All");
    expect(selectAllButton).toBeInTheDocument();
    expect(selectAllButton).toBeEnabled();

    const clearAllButton = screen.getByText("Clear All");
    expect(clearAllButton).toBeInTheDocument();
    expect(clearAllButton).toBeDisabled();

    const updatedQuery = new Set("");
    updatedQuery.add("Cooperative Agreement");
    // after clicking one of the boxes, the page should rerender
    // both select all and clear all should be enabled
    rerender(
      <SearchFilterAccordion
        filterOptions={initialFilterOptions}
        title={title}
        queryParamKey={queryParamKey}
        query={updatedQuery}
        facetCounts={fakeFacetCounts}
      />,
    );
    expect(selectAllButton).toBeEnabled();
    expect(clearAllButton).toBeEnabled();
  });

  it("has hidden attribute when collapsed", () => {
    render(
      <SearchFilterAccordion
        filterOptions={initialFilterOptions}
        title={title}
        queryParamKey={"status"}
        query={new Set()}
        facetCounts={fakeFacetCounts}
      />,
    );

    const accordionToggleButton = screen.getByTestId(
      "accordionButton_opportunity-filter-status",
    );
    const contentDiv = screen.getByTestId(
      "accordionItem_opportunity-filter-status",
    );
    expect(contentDiv).toHaveAttribute("hidden");

    // Toggle the accordion and the hidden attribute should be removed
    fireEvent.click(accordionToggleButton);
    expect(contentDiv).not.toHaveAttribute("hidden");
  });

  it("checks boxes correctly and updates count", () => {
    const { rerender } = render(
      <SearchFilterAccordion
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
    // after clicking one of the boxes, the page should rerender
    // both select all and clear all should be enabled
    rerender(
      <SearchFilterAccordion
        filterOptions={initialFilterOptions}
        title={title}
        queryParamKey={queryParamKey}
        query={updatedQuery}
        facetCounts={fakeFacetCounts}
      />,
    );

    // Verify the count updates to 2
    const countSpan = screen.getByText("2", {
      selector: ".usa-tag.usa-tag--big.radius-pill.margin-left-1",
    });
    expect(countSpan).toBeInTheDocument();
  });
});
