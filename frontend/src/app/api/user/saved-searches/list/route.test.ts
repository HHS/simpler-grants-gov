/**
 * @jest-environment node
 */

import { listSavedSearches } from "src/app/api/user/saved-searches/list/handler";
import { SavedSearchRecord } from "src/types/search/searchRequestTypes";
import { fakeSavedSearch } from "src/utils/testing/fixtures";

const mockFetchSavedSearches = jest.fn();

jest.mock("src/services/fetch/fetchers/savedSearchFetcher", () => ({
  fetchSavedSearches: (...args: unknown[]) =>
    mockFetchSavedSearches(...args) as unknown,
}));

const fakeSavedSearches = [
  fakeSavedSearch,
  { ...fakeSavedSearch, query: "again" },
];

describe("POST request", () => {
  afterEach(() => jest.clearAllMocks());
  it("sends back the result of fetchSavedSearches", async () => {
    mockFetchSavedSearches.mockResolvedValue(fakeSavedSearches);

    const response = await listSavedSearches(new Request("http://anywhere"));
    const json = (await response.json()) as SavedSearchRecord[];

    expect(response.status).toBe(200);
    expect(mockFetchSavedSearches).toHaveBeenCalledTimes(1);
    expect(json).toEqual(fakeSavedSearches);
  });

  it("sends error if fetch call fails", async () => {
    mockFetchSavedSearches.mockImplementation(() => {
      throw new Error("oops");
    });

    const response = await listSavedSearches(new Request("http://anywhere"));
    expect(response.status).toBe(500);
    expect(mockFetchSavedSearches).toHaveBeenCalledTimes(1);
  });
});
