import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { initialFilterOptions } from "src/utils/testing/fixtures";
import { render, screen } from "tests/react-utils";

import React from "react";

import { RadioButtonFilter } from "src/components/search/Filters/RadioButtonFilter";

const fakeFacetCounts = {
  grant: 1,
  other: 1,
  procurement_contract: 1,
  cooperative_agreement: 1,
};

const mockSetQueryParam = jest.fn();

jest.mock("src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    setQueryParam: mockSetQueryParam,
  }),
}));

describe("RadioButtonFilter", () => {
  const title = "Test Accordion";
  const queryParamKey = "closeDate";

  it("should not have basic accessibility issues", async () => {
    const { container } = render(
      <RadioButtonFilter
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

  it("displays the correct radio labels", () => {
    render(
      <RadioButtonFilter
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
      <RadioButtonFilter
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
      <RadioButtonFilter
        filterOptions={initialFilterOptions}
        title={title}
        queryParamKey={queryParamKey}
        query={updatedQuery}
        facetCounts={fakeFacetCounts}
      />,
    );

    // Verify the background updates after selecting options
    // actual checkbox state is tested in AccordionContent
    const titleHeading = screen.getByRole("heading");
    expect(titleHeading).toHaveClass("simpler-selected-filter");
  });
  it("adds an any option radio by default", async () => {
    render(
      <RadioButtonFilter
        filterOptions={initialFilterOptions}
        title={title}
        queryParamKey={queryParamKey}
        query={new Set("")}
        facetCounts={fakeFacetCounts}
      />,
    );
    const accordionToggleButton = screen.getByRole("button");
    await userEvent.click(accordionToggleButton);
    const anyRadio = screen.getByRole("radio", {
      name: "Any test accordion",
    });
    expect(anyRadio).toBeInTheDocument();
    expect(anyRadio).toBeChecked();
  });

  it("should be expanded by default if there are selected options", () => {
    render(
      <RadioButtonFilter
        filterOptions={initialFilterOptions}
        title={title}
        queryParamKey={queryParamKey}
        query={new Set("Cooperative Agreement")}
        facetCounts={fakeFacetCounts}
        includeAnyOption={false}
      />,
    );

    const radio = screen.getByText("Cooperative Agreement");

    expect(radio).toBeVisible();
  });

  it("should not be expanded by default if there no are selected options", () => {
    render(
      <RadioButtonFilter
        filterOptions={initialFilterOptions}
        title={title}
        queryParamKey={queryParamKey}
        query={new Set()}
        facetCounts={fakeFacetCounts}
        includeAnyOption={false}
      />,
    );

    const radio = screen.queryByText("Cooperative Agreement");

    expect(radio).not.toBeVisible();
  });
  it("calls setQueryParam correctly on toggle", async () => {
    render(
      <RadioButtonFilter
        filterOptions={initialFilterOptions}
        title={title}
        queryParamKey={queryParamKey}
        query={new Set()}
        facetCounts={undefined}
        includeAnyOption={false}
      />,
    );
    const accordionToggleButton = screen.getByRole("button");
    await userEvent.click(accordionToggleButton);
    const radioOption = screen.getByRole("radio", {
      name: "Grant",
    });
    expect(radioOption).toBeInTheDocument();
    await userEvent.click(radioOption);
    expect(mockSetQueryParam).toHaveBeenCalledWith(queryParamKey, "grant");
  });
});
