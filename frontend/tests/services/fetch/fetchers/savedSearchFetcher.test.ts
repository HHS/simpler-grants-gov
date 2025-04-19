import {
  fetchSavedSearches,
  handleDeleteSavedSearch,
  handleSavedSearch,
  handleUpdateSavedSearch,
} from "src/services/fetch/fetchers/savedSearchFetcher";
import { arbitrarySearchPagination } from "src/utils/testing/fixtures";

const fetchUserMock = jest.fn();
const fetchUserWithMethodMock = jest.fn();
const mockGetSession = jest.fn();

jest.mock("src/services/fetch/fetchers/fetchers", () => ({
  fetchUserWithMethod: (type: string) =>
    fetchUserWithMethodMock(type) as unknown,
}));

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => mockGetSession(),
}));

describe("handleSavedSearch", () => {
  afterEach(() => jest.resetAllMocks());
  it("calls fetchUserWithMethod as expected and returns json result", async () => {
    fetchUserMock.mockReturnValue({ json: () => ({ arbitrary: "data" }) });
    fetchUserWithMethodMock.mockReturnValue(fetchUserMock);
    const fakeSavedSearch = {
      pagination: arbitrarySearchPagination,
    };
    const result = await handleSavedSearch(
      "faketoken",
      "1",
      fakeSavedSearch,
      "a name",
    );

    expect(result).toEqual({ arbitrary: "data" });
    expect(fetchUserWithMethodMock).toHaveBeenCalledWith("POST");
    expect(fetchUserMock).toHaveBeenCalledWith({
      subPath: "1/saved-searches",
      additionalHeaders: {
        "X-SGG-Token": "faketoken",
      },
      body: { search_query: fakeSavedSearch, name: "a name" },
    });
  });
});

describe("fetchSavedSearches", () => {
  afterEach(() => jest.resetAllMocks());
  it("calls fetchUserWithMethod as expected and returns json result", async () => {
    mockGetSession.mockResolvedValue({ token: "faketoken", user_id: "1" });
    fetchUserMock.mockReturnValue({
      json: () => ({ data: [{ fake: "saved search" }] }),
    });
    fetchUserWithMethodMock.mockReturnValue(fetchUserMock);
    const result = await fetchSavedSearches();

    expect(result).toEqual([{ fake: "saved search" }]);
    expect(fetchUserWithMethodMock).toHaveBeenCalledWith("POST");
    expect(fetchUserMock).toHaveBeenCalledWith({
      subPath: "1/saved-searches/list",
      additionalHeaders: {
        "X-SGG-Token": "faketoken",
      },
      body: {
        pagination: {
          page_offset: 1,
          page_size: 25,
          sort_order: [
            {
              order_by: "name",
              sort_direction: "ascending",
            },
          ],
        },
      },
    });
  });
  it("returns empty array if user session is not present", async () => {
    mockGetSession.mockResolvedValue({});
    const result = await fetchSavedSearches();

    expect(result).toEqual([]);
  });
});

describe("handleUpdateSavedSearch", () => {
  afterEach(() => jest.resetAllMocks());
  it("calls fetchUserWithMethod as expected and returns json result", async () => {
    fetchUserMock.mockReturnValue({ json: () => ({ arbitrary: "data" }) });
    fetchUserWithMethodMock.mockReturnValue(fetchUserMock);
    const result = await handleUpdateSavedSearch(
      "faketoken",
      "1",
      "2",
      "a name",
    );

    expect(result).toEqual({ arbitrary: "data" });
    expect(fetchUserWithMethodMock).toHaveBeenCalledWith("PUT");
    expect(fetchUserMock).toHaveBeenCalledWith({
      subPath: "1/saved-searches/2",
      additionalHeaders: {
        "X-SGG-Token": "faketoken",
      },
      body: { name: "a name" },
    });
  });
});

describe("handleDeleteSavedSearch", () => {
  afterEach(() => jest.resetAllMocks());
  it("calls fetchUserWithMethod as expected and returns json result", async () => {
    fetchUserMock.mockReturnValue({ json: () => ({ arbitrary: "data" }) });
    fetchUserWithMethodMock.mockReturnValue(fetchUserMock);
    const result = await handleDeleteSavedSearch("faketoken", "1", "2");

    expect(result).toEqual({ arbitrary: "data" });
    expect(fetchUserWithMethodMock).toHaveBeenCalledWith("DELETE");
    expect(fetchUserMock).toHaveBeenCalledWith({
      subPath: "1/saved-searches/2",
      additionalHeaders: {
        "X-SGG-Token": "faketoken",
      },
    });
  });
});
