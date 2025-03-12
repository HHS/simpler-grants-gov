import { handleSavedSearch } from "src/services/fetch/fetchers/savedSearchFetcher";
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
