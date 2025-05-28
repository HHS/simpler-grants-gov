import { render, screen } from "@testing-library/react";
import {
  fakeSearchAPIResponse,
  searchFetcherParams,
} from "src/utils/testing/fixtures";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import { SearchDrawerFilters } from "src/components/search/SearchDrawerFilters";

const mockUpdateQueryParams = jest.fn();

jest.mock("src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    updateQueryParams: mockUpdateQueryParams,
  }),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

describe("SearchDrawerFilters", () => {
  it("renders without errors", async () => {
    const component = await SearchDrawerFilters({
      searchParams: searchFetcherParams,
      searchResultsPromise: Promise.resolve(fakeSearchAPIResponse),
    });
    render(component);

    const title = await screen.findByText("accordion.titles.funding");
    expect(title).toBeInTheDocument();
  });
  it("renders expected checkbox filters", async () => {
    const component = await SearchDrawerFilters({
      searchParams: searchFetcherParams,
      searchResultsPromise: Promise.resolve(fakeSearchAPIResponse),
    });
    render(component);
    expect(
      screen.getByTestId("accordion.titles.funding-filter"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("accordion.titles.eligibility-filter"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("accordion.titles.category-filter"),
    ).toBeInTheDocument();
  });
});
