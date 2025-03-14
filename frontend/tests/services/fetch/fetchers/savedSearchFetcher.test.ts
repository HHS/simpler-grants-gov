import {
  fetchSavedSearches,
  handleSavedSearch,
} from "src/services/fetch/fetchers/savedSearchFetcher";
import { arbitrarySearchPagination } from "src/utils/testing/fixtures";

const fetchUserMock = jest.fn();
const fetchUserWithMethodMock = jest.fn();

jest.mock("src/services/fetch/fetchers/fetchers", () => ({
  fetchUserWithMethod: (type: string) =>
    fetchUserWithMethodMock(type) as unknown,
}));

describe("handleSavedSearch", () => {
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
  it("calls fetchUserWithMethod as expected and returns json result", async () => {
    fetchUserMock.mockReturnValue({
      json: () => ({ data: [{ fake: "saved search" }] }),
    });
    fetchUserWithMethodMock.mockReturnValue(fetchUserMock);
    const result = await fetchSavedSearches("faketoken", "1");

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
});
