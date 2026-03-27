import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import {
  FakeQueryProvider,
  mockUpdateQueryTerm,
} from "src/utils/testing/providerMocks";

import { ReadonlyURLSearchParams } from "next/navigation";
import React from "react";

import SearchBar from "src/components/search/SearchBar";
import { SearchLabel } from "src/components/search/SearchBarWithLabel";

const mockUpdateQueryParams = jest.fn();

jest.mock("src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    updateQueryParams: mockUpdateQueryParams,
    searchParams: new ReadonlyURLSearchParams(),
  }),
}));

jest.mock("src/hooks/useFeatureFlags", () => ({
  useFeatureFlags: () => ({
    checkFeatureFlag: () => true,
  }),
}));

describe("SearchBar", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("should not have basic accessibility issues", async () => {
    const { container } = render(
      <FakeQueryProvider>
        <SearchBar LabelComponent={SearchLabel} />
      </FakeQueryProvider>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("updates the input value when typing in the search field", () => {
    render(
      <FakeQueryProvider queryTerm="new query">
        <SearchBar LabelComponent={SearchLabel} />
      </FakeQueryProvider>,
    );

    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "new query" } });

    expect(input).toHaveValue("new query");
  });

  it("calls updateQueryParams with the correct argument when submitting the form", () => {
    render(
      <FakeQueryProvider queryTerm="new query">
        <SearchBar LabelComponent={SearchLabel} />
      </FakeQueryProvider>,
    );

    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "new query" } });

    const searchButton = screen.getByRole("button", { name: /search/i });
    fireEvent.click(searchButton);

    expect(mockUpdateQueryParams).toHaveBeenCalledWith("", "", "new query");
  });

  it("raises a validation error on submit if search term is > 99 characters, then clears error on successful search", () => {
    const { rerender } = render(
      <FakeQueryProvider queryTerm="how long do I need to type for before I get to 100 characters? it's looking like around two sentenc-">
        <SearchBar LabelComponent={SearchLabel} />
      </FakeQueryProvider>,
    );
    const searchButton = screen.getByRole("button", { name: /search/i });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.click(searchButton);

    expect(mockUpdateQueryParams).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeInTheDocument();

    rerender(
      <FakeQueryProvider queryTerm="totally valid search terms">
        <SearchBar LabelComponent={SearchLabel} />
      </FakeQueryProvider>,
    );
    fireEvent.click(searchButton);
    expect(mockUpdateQueryParams).toHaveBeenCalledWith(
      "",
      "",
      "totally valid search terms",
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("applies queued `andOr` update if available", () => {
    render(
      <FakeQueryProvider localAndOrParam="OR" queryTerm="a search term">
        <SearchBar LabelComponent={SearchLabel} />
      </FakeQueryProvider>,
    );

    const searchButton = screen.getByRole("button", { name: /search/i });
    fireEvent.click(searchButton);
    expect(mockUpdateQueryParams).toHaveBeenCalledWith(
      "OR",
      "andOr",
      "a search term",
    );
  });

  it("updates params if query term is passed in from parent", () => {
    const { rerender } = render(
      <FakeQueryProvider queryTerm="a search term">
        <SearchBar LabelComponent={SearchLabel} />
      </FakeQueryProvider>,
    );
    expect(mockUpdateQueryTerm).toHaveBeenCalledWith("");
    rerender(
      <FakeQueryProvider queryTerm="a search term">
        <SearchBar
          LabelComponent={SearchLabel}
          queryTermFromParent="new stuff"
        />
      </FakeQueryProvider>,
    );
    expect(mockUpdateQueryTerm).toHaveBeenCalledWith("new stuff");
  });
});
