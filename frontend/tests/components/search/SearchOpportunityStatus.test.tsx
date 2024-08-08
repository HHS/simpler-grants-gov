import "@testing-library/jest-dom/extend-expect";
import { axe } from "jest-axe";
import { fireEvent } from "@testing-library/react";
import { render, screen } from "tests/react-utils";
import React from "react";
import SearchOpportunityStatus from "src/components/search/SearchOpportunityStatus";

const mockUpdateQueryParams = jest.fn();

jest.mock("src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    updateQueryParams: mockUpdateQueryParams,
  }),
}));

describe("SearchOpportunityStatus", () => {
  it("passes accessibility scan", async () => {
    const { container } = render(<SearchOpportunityStatus query={new Set()} />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it("component renders with checkboxes", () => {
    render(<SearchOpportunityStatus query={new Set()} />);

    expect(screen.getByText("Forecasted")).toBeEnabled();
    expect(screen.getByText("Posted")).toBeEnabled();
    expect(screen.getByText("Closed")).toBeEnabled();
    expect(screen.getByText("Archived")).toBeEnabled();
  });

  it("checking a checkbox calls updateQueryParams and requestSubmit", () => {
    const query = new Set("");
    query.add("test");
    const combined = new Set("");
    combined.add("test").add("forecasted");
    render(<SearchOpportunityStatus query={query} />);

    const forecastedCheckbox = screen.getByRole("checkbox", {
      name: "Forecasted",
    });

    fireEvent.click(forecastedCheckbox);

    expect(mockUpdateQueryParams).toHaveBeenCalledWith(
      combined,
      "status",
      undefined,
    );
  });
});
