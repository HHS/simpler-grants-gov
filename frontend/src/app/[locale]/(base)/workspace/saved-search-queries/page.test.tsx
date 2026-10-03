import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import SavedSearchQueries from "src/app/[locale]/(base)/workspace/saved-search-queries/page";
import { fakeSavedSearch } from "src/utils/testing/fixtures";
import { localeParams, mockUseTranslations } from "src/utils/testing/intlMocks";

const mockUseSearchParams = jest.fn().mockReturnValue(new URLSearchParams());
const mockBreadcrumbs = jest.fn();

jest.mock("next/navigation", () => ({
  useSearchParams: () => mockUseSearchParams() as unknown,
  usePathname: () => "/workspace/saved-search-queries",
  useRouter: () => ({ push: jest.fn() }),
}));

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

const savedSearches = [
  { search_query: fakeSavedSearch, name: "whatever", saved_search_id: "1" },
  { search_query: fakeSavedSearch, name: "whatever", saved_search_id: "2" },
  { search_query: fakeSavedSearch, name: "whatever", saved_search_id: "3" },
  { search_query: fakeSavedSearch, name: "whatever", saved_search_id: "4" },
  { search_query: fakeSavedSearch, name: "whatever", saved_search_id: "5" },
];

const mockFetchSavedSearchesPage = jest.fn().mockResolvedValue({
  savedSearches,
  paginationInfo: { total_pages: 1, total_records: 5 },
});

const mockPerformAgencySearch = jest.fn().mockResolvedValue([]);

const getSessionMock = jest.fn(() => ({
  token: "a token",
}));

jest.mock("src/services/fetch/fetchers/savedSearchFetcher", () => ({
  fetchSavedSearchesPage: (page: number): unknown =>
    mockFetchSavedSearchesPage(page),
}));

jest.mock("src/services/fetch/fetchers/agenciesFetcher", () => ({
  performAgencySearch: (): unknown => mockPerformAgencySearch(),
}));

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => getSessionMock(),
}));

jest.mock(
  "src/app/[locale]/(base)/workspace/saved-search-queries/_components/SavedSearchesList",
  () => ({
    SavedSearchesList: ({ savedSearches }: { savedSearches: [] }) => (
      <span data-testid="fakeSavedSearchList">{savedSearches.length}</span>
    ),
  }),
);

describe("Saved Searches page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders intro text for user with no saved searches", async () => {
    mockFetchSavedSearchesPage.mockResolvedValueOnce({
      savedSearches: [],
      paginationInfo: { total_pages: 0, total_records: 0 },
    });

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

  it("renders pagination above and below lists with more than 25 searches", async () => {
    mockUseSearchParams.mockReturnValueOnce(new URLSearchParams("page=2"));
    mockFetchSavedSearchesPage.mockResolvedValueOnce({
      savedSearches,
      paginationInfo: { total_pages: 3, total_records: 55 },
    });

    const component = await SavedSearchQueries({
      params: localeParams,
      searchParams: Promise.resolve({ page: "2" }),
    });
    render(component);

    expect(mockFetchSavedSearchesPage).toHaveBeenCalledWith(2);
    expect(
      screen.getAllByRole("navigation", { name: /pagination/i }),
    ).toHaveLength(2);
  });

  it("does not render pagination for 25 or fewer searches", async () => {
    const component = await SavedSearchQueries({ params: localeParams });
    render(component);

    expect(
      screen.queryByRole("navigation", { name: /pagination/i }),
    ).not.toBeInTheDocument();
  });

  it("passes accessibility scan", async () => {
    const component = await SavedSearchQueries({ params: localeParams });
    const { container } = render(component);
    const results = await waitFor(() => axe(container));

    expect(results).toHaveNoViolations();
  });
});
