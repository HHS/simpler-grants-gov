/**
 * @jest-environment node
 */

import { listSavedSearches } from "src/app/api/user/saved-searches/list/handler";
import { SavedSearchRecord } from "src/types/search/searchRequestTypes";
import { fakeSavedSearch } from "src/utils/testing/fixtures";

const getSessionMock = jest.fn();
const mockFetchSavedSearches = jest.fn();

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => getSessionMock(),
}));

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
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
      user_id: "1",
    }));

    mockFetchSavedSearches.mockResolvedValue(fakeSavedSearches);

    const response = await listSavedSearches(new Request("http://anywhere"));
    const json = (await response.json()) as SavedSearchRecord[];

    expect(response.status).toBe(200);
    expect(mockFetchSavedSearches).toHaveBeenCalledTimes(1);
    expect(json).toEqual(fakeSavedSearches);
    expect(getSessionMock).toHaveBeenCalledTimes(1);
  });

  it("sends unauthorized error if session is not available", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "",
    }));

    const response = await listSavedSearches(new Request("http://anywhere"));
    expect(response.status).toBe(401);
    expect(mockFetchSavedSearches).toHaveBeenCalledTimes(0);
  });

  it("sends error if fetch call fails", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));

    mockFetchSavedSearches.mockImplementation(() => {
      throw new Error("oops");
    });

    const response = await listSavedSearches(new Request("http://anywhere"));
    expect(response.status).toBe(500);
    expect(mockFetchSavedSearches).toHaveBeenCalledTimes(1);
  });
});
