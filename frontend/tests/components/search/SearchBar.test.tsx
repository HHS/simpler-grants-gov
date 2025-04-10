import "@testing-library/jest-dom";

import { fireEvent } from "@testing-library/react";
import { axe } from "jest-axe";
import QueryProvider from "src/services/search/QueryProvider";
import { render, screen } from "tests/react-utils";

import { ReadonlyURLSearchParams } from "next/navigation";
import React from "react";

import SearchBar from "src/components/search/SearchBar";

// Mock the hook since it's used in the component
const mockUpdateQueryParams = jest.fn();

jest.mock("src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    updateQueryParams: mockUpdateQueryParams,
    searchParams: new ReadonlyURLSearchParams(),
  }),
}));

const initialQueryParams = "initial query";

describe("SearchBar", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("should not have basic accessibility issues", async () => {
    const { container } = render(
      <QueryProvider>
        <SearchBar queryTermFromParent={initialQueryParams} />
      </QueryProvider>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("updates the input value when typing in the search field", () => {
    render(
      <QueryProvider>
        <SearchBar queryTermFromParent={initialQueryParams} />
      </QueryProvider>,
    );

    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "new query" } });

    expect(input).toHaveValue("new query");
  });

  it("calls updateQueryParams with the correct argument when submitting the form", () => {
    render(
      <QueryProvider>
        <SearchBar queryTermFromParent={initialQueryParams} />
      </QueryProvider>,
    );

    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "new query" } });

    const searchButton = screen.getByRole("button", { name: /search/i });
    fireEvent.click(searchButton);

    expect(mockUpdateQueryParams).toHaveBeenCalledWith(
      "",
      "query",
      "new query",
    );
  });

  it("raises a validation error on submit if search term is > 99 characters, then clears error on successful search", () => {
    render(
      <QueryProvider>
        <SearchBar queryTermFromParent={initialQueryParams} />
      </QueryProvider>,
    );

    const input = screen.getByRole("searchbox");
    fireEvent.change(input, {
      target: {
        value:
          "how long do I need to type for before I get to 100 characters? it's looking like around two sentenc-",
      },
    });

    const searchButton = screen.getByRole("button", { name: /search/i });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.click(searchButton);

    expect(mockUpdateQueryParams).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeInTheDocument();

    fireEvent.change(input, {
      target: {
        value: "totally valid search terms",
      },
    });
    fireEvent.click(searchButton);
    expect(mockUpdateQueryParams).toHaveBeenCalledWith(
      "",
      "query",
      "totally valid search terms",
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
