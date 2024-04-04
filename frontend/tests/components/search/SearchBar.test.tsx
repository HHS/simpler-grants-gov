import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";

import React from "react";
import SearchBar from "../../../src/components/search/SearchBar";
import { axe } from "jest-axe";

// jest.mock("src/hooks/useSearchParamUpdater");

// Mock the hook since it's used in the component
const mockUpdateQueryParams = jest.fn();

jest.mock("../../../src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    updateQueryParams: mockUpdateQueryParams,
  }),
}));

describe("SearchBar", () => {
  const initialQueryParams = "initial query";

  it("should not have basic accessibility issues", async () => {
    const { container } = render(
      <SearchBar initialQueryParams={initialQueryParams} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("updates the input value when typing in the search field", () => {
    render(<SearchBar initialQueryParams={initialQueryParams} />);

    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "new query" } });

    expect(input).toHaveValue("new query");
  });

  it("calls updateQueryParams with the correct argument when submitting the form", () => {
    render(<SearchBar initialQueryParams={initialQueryParams} />);

    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "new query" } });

    const searchButton = screen.getByRole("button", { name: /search/i });
    fireEvent.click(searchButton);

    expect(mockUpdateQueryParams).toHaveBeenCalledWith("new query", "query");
  });
});
