import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import SavedSearchQueries from "src/app/[locale]/(base)/workspace/saved-search-queries/page";
import { fakeSavedSearch } from "src/utils/testing/fixtures";
import { localeParams, mockUseTranslations } from "src/utils/testing/intlMocks";

const mockUseSearchParams = jest.fn().mockReturnValue(new URLSearchParams());
const mockBreadcrumbs = jest.fn();

jest.mock("next/navigation", () => ({
  useSearchParams: () => mockUseSearchParams() as unknown,
}));

jest.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve(mockUseTranslations),
}));

jest.mock("src/components/Breadcrumbs", () => ({
  __esModule: true,
  default: (props: { breadcrumbList: { title: string; path: string }[] }) => {
    mockBreadcrumbs(props);
    return <nav data-testid="mock-breadcrumbs" />;
  },
}));

const mockFetchSavedSearches = jest.fn().mockResolvedValue([
  { search_query: fakeSavedSearch, name: "whatever", saved_search_id: "1" },
  { search_query: fakeSavedSearch, name: "whatever", saved_search_id: "2" },
  { search_query: fakeSavedSearch, name: "whatever", saved_search_id: "3" },
  { search_query: fakeSavedSearch, name: "whatever", saved_search_id: "4" },
  { search_query: fakeSavedSearch, name: "whatever", saved_search_id: "5" },
]);

const mockPerformAgencySearch = jest.fn().mockResolvedValue([]);

const getSessionMock = jest.fn(() => ({
  token: "a token",
}));

jest.mock("src/services/fetch/fetchers/savedSearchFetcher", () => ({
  fetchSavedSearches: (): unknown => mockFetchSavedSearches(),
}));

jest.mock("src/services/fetch/fetchers/agenciesFetcher", () => ({
  performAgencySearch: (): unknown => mockPerformAgencySearch(),
}));

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => getSessionMock(),
}));

jest.mock("src/components/workspace/SavedSearchesList", () => ({
  SavedSearchesList: ({ savedSearches }: { savedSearches: [] }) => (
    <span data-testid="fakeSavedSearchList">{savedSearches.length}</span>
  ),
}));

describe("Saved Searches page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders intro text for user with no saved searches", async () => {
    mockFetchSavedSearches.mockResolvedValueOnce([]);

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

  it("passes accessibility scan", async () => {
    const component = await SavedSearchQueries({ params: localeParams });
    const { container } = render(component);
    const results = await waitFor(() => axe(container));

    expect(results).toHaveNoViolations();
  });
});
