import { render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import SavedSearchQueries from "src/app/[locale]/(base)/saved-search-queries/page";
import { fakeSavedSearch } from "src/utils/testing/fixtures";
import { localeParams, mockUseTranslations } from "src/utils/testing/intlMocks";

const mockUseSearchParams = jest.fn().mockReturnValue(new URLSearchParams());

jest.mock("next/navigation", () => ({
  useSearchParams: () => mockUseSearchParams() as unknown,
}));

jest.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve(mockUseTranslations),
}));

const mockFetchSavedSearches = jest.fn().mockResolvedValue([
  { search_query: fakeSavedSearch, name: "whatever", id: "not unique" },
  { search_query: fakeSavedSearch, name: "whatever", id: "not unique" },
  { search_query: fakeSavedSearch, name: "whatever", id: "not unique" },
  { search_query: fakeSavedSearch, name: "whatever", id: "not unique" },
  { search_query: fakeSavedSearch, name: "whatever", id: "not unique" },
]);
const getSessionMock = jest.fn(() => ({
  token: "a token",
}));

jest.mock("src/services/fetch/fetchers/savedSearchFetcher", () => ({
  fetchSavedSearches: (...args: unknown[]) =>
    mockFetchSavedSearches(args) as unknown,
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
  it("renders intro text for user with no saved searches", async () => {
    const component = await SavedSearchQueries({ params: localeParams });
    render(component);

    const content = screen.getByText("heading");

    expect(content).toBeInTheDocument();
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
