import {
  fetchSavedSearches,
  fetchSavedSearchesPaginated,
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
    const result = await handleSavedSearch("1", fakeSavedSearch, "a name");

    expect(result).toEqual({ arbitrary: "data" });
    expect(fetchUserWithMethodMock).toHaveBeenCalledWith("POST");
    expect(fetchUserMock).toHaveBeenCalledWith({
      subPath: "1/saved-searches",
      body: { search_query: fakeSavedSearch, name: "a name" },
    });
  });
});

describe("fetchSavedSearchesPaginated", () => {
  afterEach(() => jest.resetAllMocks());

  it("uses the requested page and returns pagination metadata", async () => {
    mockGetSession.mockResolvedValue({ token: "faketoken", user_id: "1" });
    const paginationInfo = {
      order_by: "name",
      page_offset: 2,
      page_size: 25,
      sort_direction: "ascending",
      total_pages: 3,
      total_records: 51,
    };
    fetchUserMock.mockReturnValue({
      json: () => ({
        data: [{ fake: "saved search" }],
        pagination_info: paginationInfo,
      }),
    });
    fetchUserWithMethodMock.mockReturnValue(fetchUserMock);

    const result = await fetchSavedSearchesPaginated(2);

    expect(result).toEqual({
      savedSearches: [{ fake: "saved search" }],
      paginationInfo,
    });
    expect(fetchUserWithMethodMock).toHaveBeenCalledWith("POST");
    expect(fetchUserMock).toHaveBeenCalledWith({
      subPath: "1/saved-searches/list",
      body: {
        pagination: {
          page_offset: 2,
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

  it("returns an empty result if user session is not present", async () => {
    mockGetSession.mockResolvedValue({});

    const result = await fetchSavedSearchesPaginated(2);

    expect(result).toEqual({ savedSearches: [] });
    expect(fetchUserWithMethodMock).not.toHaveBeenCalled();
  });
});

describe("fetchSavedSearches", () => {
  afterEach(() => jest.resetAllMocks());

  it("preserves the existing array return shape", async () => {
    mockGetSession.mockResolvedValue({ token: "faketoken", user_id: "1" });
    fetchUserMock.mockReturnValue({
      json: () => ({
        data: [{ fake: "saved search" }],
        pagination_info: {
          order_by: "name",
          page_offset: 1,
          page_size: 25,
          sort_direction: "ascending",
          total_pages: 1,
          total_records: 1,
        },
      }),
    });
    fetchUserWithMethodMock.mockReturnValue(fetchUserMock);

    const result = await fetchSavedSearches();

    expect(result).toEqual([{ fake: "saved search" }]);
    expect(fetchUserWithMethodMock).toHaveBeenCalledWith("POST");
    expect(fetchUserMock).toHaveBeenCalledWith({
      subPath: "1/saved-searches/list",
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
    const result = await handleUpdateSavedSearch("1", "2", "a name");

    expect(result).toEqual({ arbitrary: "data" });
    expect(fetchUserWithMethodMock).toHaveBeenCalledWith("PUT");
    expect(fetchUserMock).toHaveBeenCalledWith({
      subPath: "1/saved-searches/2",
      body: { name: "a name" },
    });
  });
});

describe("handleDeleteSavedSearch", () => {
  afterEach(() => jest.resetAllMocks());
  it("calls fetchUserWithMethod as expected and returns json result", async () => {
    fetchUserMock.mockReturnValue({ json: () => ({ arbitrary: "data" }) });
    fetchUserWithMethodMock.mockReturnValue(fetchUserMock);
    const result = await handleDeleteSavedSearch("1", "2");

    expect(result).toEqual({ arbitrary: "data" });
    expect(fetchUserWithMethodMock).toHaveBeenCalledWith("DELETE");
    expect(fetchUserMock).toHaveBeenCalledWith({
      subPath: "1/saved-searches/2",
    });
  });
});
