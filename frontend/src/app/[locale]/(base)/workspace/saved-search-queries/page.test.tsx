import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import SavedSearchQueries from "src/app/[locale]/(base)/workspace/saved-search-queries/page";
import { fakeSavedSearch } from "src/utils/testing/fixtures";
import { localeParams, mockUseTranslations } from "src/utils/testing/intlMocks";

const mockBreadcrumbs = jest.fn();
const mockFetchSavedSearchesPaginated = jest.fn();
const mockPerformAgencySearch = jest.fn().mockResolvedValue([]);

jest.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve(mockUseTranslations),
}));

jest.mock("src/components/core/Breadcrumbs", () => ({
  __esModule: true,
  default: (props: { breadcrumbList: { title: string; path: string }[] }) => {
    mockBreadcrumbs(props);
    return <nav data-testid="mock-breadcrumbs" />;
  },
}));

jest.mock(
  "src/app/[locale]/(base)/grantor/opportunities/_components/OpportunitiesPagination",
  () => ({
    __esModule: true,
    default: ({ totalPages }: { totalPages: number }) => (
      <div data-testid="saved-search-pagination">{totalPages}</div>
    ),
  }),
);

jest.mock("src/services/fetch/fetchers/savedSearchFetcher", () => ({
  fetchSavedSearchesPaginated: (page: number): unknown =>
    mockFetchSavedSearchesPaginated(page),
}));

jest.mock("src/services/fetch/fetchers/agenciesFetcher", () => ({
  performAgencySearch: (): unknown => mockPerformAgencySearch(),
}));

jest.mock(
  "src/app/[locale]/(base)/workspace/saved-search-queries/_components/SavedSearchesList",
  () => ({
    SavedSearchesList: ({ savedSearches }: { savedSearches: [] }) => (
      <span data-testid="fakeSavedSearchList">{savedSearches.length}</span>
    ),
  }),
);

const savedSearches = [
  { search_query: fakeSavedSearch, name: "whatever", saved_search_id: "1" },
  { search_query: fakeSavedSearch, name: "whatever", saved_search_id: "2" },
  { search_query: fakeSavedSearch, name: "whatever", saved_search_id: "3" },
  { search_query: fakeSavedSearch, name: "whatever", saved_search_id: "4" },
  { search_query: fakeSavedSearch, name: "whatever", saved_search_id: "5" },
];

const paginatedResult = (
  results = savedSearches,
  totalPages = 1,
) => ({
  savedSearches: results,
  paginationInfo: {
    order_by: "name",
    page_offset: 1,
    page_size: 25,
    sort_direction: "ascending",
    total_pages: totalPages,
    total_records: results.length,
  },
});

describe("Saved Searches page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchSavedSearchesPaginated.mockResolvedValue(paginatedResult());
  });

  it("renders intro text for user with no saved searches", async () => {
    mockFetchSavedSearchesPaginated.mockResolvedValueOnce(
      paginatedResult([], 0),
    );

    const component = await SavedSearchQueries({ params: localeParams });
    render(component);

    expect(screen.getByText("heading")).toBeInTheDocument();
  });

  it("passes the correct breadcrumbs", async () => {
    const component = await SavedSearchQueries({ params: localeParams });
    render(component);

    expect(screen.getByTestId("mock-breadcrumbs")).toBeInTheDocument();

    expect(mockBreadcrumbs).toHaveBeenCalledWith({
      breadcrumbList: [
        {
          title: "breadcrumbWorkspace",
          path: "/workspace",
        },
        {
          title: "breadcrumbSavedQueries",
        },
      ],
    });
  });

  it("renders a list of saved searches", async () => {
    const component = await SavedSearchQueries({ params: localeParams });
    render(component);

    expect(screen.getByTestId("fakeSavedSearchList")).toHaveTextContent("5");
  });

  it("does not render pagination when there is only one page", async () => {
    const component = await SavedSearchQueries({ params: localeParams });
    render(component);

    expect(screen.queryByTestId("saved-search-pagination")).not.toBeInTheDocument();
  });

  it("renders pagination above and below the list when there is more than one page", async () => {
    mockFetchSavedSearchesPaginated.mockResolvedValueOnce(
      paginatedResult(savedSearches, 2),
    );

    const component = await SavedSearchQueries({ params: localeParams });
    render(component);

    expect(screen.getAllByTestId("saved-search-pagination")).toHaveLength(2);
  });

  it("forwards page 2 to the paginated saved-search fetcher", async () => {
    const component = await SavedSearchQueries({
      params: localeParams,
      searchParams: Promise.resolve({ page: "2" }),
    });
    render(component);

    expect(mockFetchSavedSearchesPaginated).toHaveBeenCalledWith(2);
  });

  it.each(["0", "-1", "not-a-number"])(
    "falls back to page 1 for invalid page value %s",
    async (page) => {
      const component = await SavedSearchQueries({
        params: localeParams,
        searchParams: Promise.resolve({ page }),
      });
      render(component);

      expect(mockFetchSavedSearchesPaginated).toHaveBeenCalledWith(1);
    },
  );

  it("passes current-page saved-search data to the list", async () => {
    mockFetchSavedSearchesPaginated.mockResolvedValueOnce(
      paginatedResult([savedSearches[0]], 2),
    );

    const component = await SavedSearchQueries({
      params: localeParams,
      searchParams: Promise.resolve({ page: "2" }),
    });
    render(component);

    expect(screen.getByTestId("fakeSavedSearchList")).toHaveTextContent("1");
  });

  it("passes accessibility scan", async () => {
    const component = await SavedSearchQueries({ params: localeParams });
    const { container } = render(component);
    const results = await waitFor(() => axe(container));

    expect(results).toHaveNoViolations();
  });
});
