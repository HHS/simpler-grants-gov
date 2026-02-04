import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";

import React from "react";

import { BasicSearchFilterAccordion } from "src/components/search/SearchFilterAccordion/SearchFilterAccordion";

const mockUpdateQueryParams = jest.fn();

jest.mock("src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    updateQueryParams: mockUpdateQueryParams,
  }),
}));

const title = "Test Accordion";
const queryParamKey = "fundingInstrument";

describe("BasicSearchFilterAccordion", () => {
  it("should not have basic accessibility issues", async () => {
    const { container } = render(
      <BasicSearchFilterAccordion
        title={title}
        queryParamKey={queryParamKey}
        query={new Set()}
      >
        <div>some filter content</div>
      </BasicSearchFilterAccordion>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has hidden attribute when collapsed", () => {
    render(
      <BasicSearchFilterAccordion
        title={title}
        queryParamKey={"status"}
        query={new Set()}
      >
        <div>some filter content</div>
      </BasicSearchFilterAccordion>,
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

  it("renders the correct title", () => {
    render(
      <BasicSearchFilterAccordion
        title={title}
        queryParamKey={queryParamKey}
        query={new Set("")}
      >
        <div>some filter content</div>
      </BasicSearchFilterAccordion>,
    );
    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
  });
  it("displays content", () => {
    render(
      <BasicSearchFilterAccordion
        title={title}
        queryParamKey={"status"}
        query={new Set()}
      >
        <div data-testid="some content">some filter content</div>
      </BasicSearchFilterAccordion>,
    );

    expect(screen.getByTestId("some content")).toBeInTheDocument();
  });
});
