import { act, render, screen } from "@testing-library/react";
import { identity } from "lodash";
import {
  fakeAgencyResponseData,
  fakeSearchAPIResponse,
  searchFetcherParams,
} from "src/utils/testing/fixtures";
import { useTranslationsMock } from "src/utils/testing/intlMocks";

import { SearchDrawerFilters } from "src/components/search/SearchDrawerFilters";

const mockUpdateQueryParams = jest.fn();
const mockGetAgenciesForFilterOptions = jest.fn().mockResolvedValue([]);

jest.mock("src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    updateQueryParams: mockUpdateQueryParams,
  }),
}));

jest.mock("src/hooks/useSearchParamUpdater", () => ({
  useSearchParamUpdater: () => ({
    updateQueryParams: mockUpdateQueryParams,
  }),
}));

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
}));

jest.mock("src/services/fetch/fetchers/agenciesFetcher", () => ({
  getAgenciesForFilterOptions: () =>
    mockGetAgenciesForFilterOptions() as unknown,
}));

// jest.mock("react", () => ({
//   ...jest.requireActual<typeof import("react")>("react"),
//   Suspense: ({ fallback }: { fallback: React.Component }) => fallback,
// }));

describe("SearchDrawerFilters", () => {
  it("renders without errors", async () => {
    const component = await SearchDrawerFilters({
      searchParams: searchFetcherParams,
      searchResultsPromise: Promise.resolve(fakeSearchAPIResponse),
      agencyListPromise: Promise.resolve(fakeAgencyResponseData),
    });
    render(component);

    const title = await screen.findByText("accordion.titles.funding");
    expect(title).toBeInTheDocument();
  });
  it("renders expected checkbox filters", async () => {
    const component = await SearchDrawerFilters({
      searchParams: searchFetcherParams,
      searchResultsPromise: Promise.resolve(fakeSearchAPIResponse),
      agencyListPromise: Promise.resolve(fakeAgencyResponseData),
    });

    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(() => {
      return render(component);
    });

    expect(
      screen.getByTestId("accordion.titles.funding-filter"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("accordion.titles.eligibility-filter"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("accordion.titles.category-filter"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("accordion.titles.status-filter"),
    ).toBeInTheDocument();
    await screen.findByTestId("accordion.titles.agency-filter");
  });
});
