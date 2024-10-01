import { render, screen, waitFor } from "@testing-library/react";
import { identity } from "lodash";
import { QueryParamKey } from "src/types/search/searchResponseTypes";
import { useTranslationsMock } from "tests/utils/intlMocks";

import SearchFilters from "src/components/search/SearchFilters";

const filterConfigurationFixture = {
  filterOptions: [
    {
      id: "1",
      label: "one",
      value: "one",
    },
  ],
  query: new Set("first"),
  queryParamKey: "status" as QueryParamKey,
  title: "accordion header",
};

const mockUpdateQueryParams = jest.fn();

jest.mock("src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    updateQueryParams: mockUpdateQueryParams,
  }),
}));

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
  unstable_setRequestLocale: identity,
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

describe("SearchFilters", () => {
  it("Renders without errors", () => {
    render(
      <SearchFilters
        opportunityStatus={new Set()}
        filterConfigurations={[filterConfigurationFixture]}
      />,
    );

    const component = screen.getByTestId("content-display-toggle");
    expect(component).toBeInTheDocument();
  });

  // there are likely better ways to test this behavior
  // the best would be to set up different scenarios with different viewport sizes and validate whether
  // the toggle button and filters are visible, but would require some more work.
  // see https://stackoverflow.com/questions/72747196/how-to-write-unit-test-cases-for-different-screen-sizes
  it("Renders filters with class to prevent hiding on mobile depending on toggle value", async () => {
    render(
      <SearchFilters
        opportunityStatus={new Set()}
        filterConfigurations={[filterConfigurationFixture]}
      />,
    );

    const filters = screen.getByTestId("search-filters");
    expect(filters).toBeInTheDocument();
    expect(filters).toHaveClass("display-none");

    const toggle = screen.getByText("Show Filters");
    expect(toggle).toBeInTheDocument();
    toggle.click();

    await waitFor(
      () => {
        const updatedFilters = screen.getByTestId("search-filters");
        expect(updatedFilters).not.toHaveClass("display-none");
      },
      { timeout: 50 },
    );
  });
});
