import {
  buildPageUrl,
  fetchPageWithLastPageFallback,
  parsePageParam,
} from "src/components/core/paginatedTable/paginatedTableUtils";

const pageResponse = (
  data: string[],
  { page = 1, totalPages = 1, totalRecords = data.length } = {},
) => ({
  data,
  pagination_info: {
    page_offset: page,
    total_pages: totalPages,
    total_records: totalRecords,
  },
});

describe("parsePageParam", () => {
  it.each([
    [undefined, 1],
    [null, 1],
    ["", 1],
    ["1", 1],
    ["3", 3],
    ["42", 42],
    ["0", 1],
    ["-2", 1],
    ["2.5", 1],
    ["abc", 1],
    ["NaN", 1],
    ["Infinity", 1],
    ["99999999999999999999", 1],
    [["4", "7"], 4],
    [[], 1],
  ])("parses %p as page %p", (raw, expected) => {
    expect(parsePageParam(raw)).toBe(expected);
  });
});

describe("buildPageUrl", () => {
  it("adds the page param to an empty query", () => {
    expect(buildPageUrl("/workspace/applications", "", 2)).toBe(
      "/workspace/applications?page=2",
    );
  });

  it("handles null or undefined search params", () => {
    expect(buildPageUrl("/a", null, 3)).toBe("/a?page=3");
    expect(buildPageUrl("/a", undefined, 3)).toBe("/a?page=3");
  });

  it("replaces an existing page param and preserves other params", () => {
    expect(buildPageUrl("/a", "foo=bar&page=9", 4)).toBe("/a?foo=bar&page=4");
  });

  it("accepts a leading question mark (window.location.search)", () => {
    expect(buildPageUrl("/a", "?page=9&x=1", 1)).toBe("/a?page=1&x=1");
  });

  it("accepts URLSearchParams", () => {
    expect(buildPageUrl("/a", new URLSearchParams({ x: "y" }), 2)).toBe(
      "/a?x=y&page=2",
    );
  });
});

describe("fetchPageWithLastPageFallback", () => {
  it("returns the requested page when it has data", async () => {
    const fetchPage = jest
      .fn()
      .mockResolvedValue(pageResponse(["a", "b"], { page: 2, totalPages: 3 }));

    const result = await fetchPageWithLastPageFallback(fetchPage, 2);

    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(fetchPage).toHaveBeenCalledWith(2);
    expect(result).toEqual({
      response: pageResponse(["a", "b"], { page: 2, totalPages: 3 }),
      page: 2,
    });
    expect(result.requestedPage).toBeUndefined();
  });

  it("returns an empty data set without refetching", async () => {
    const empty = pageResponse([], { totalPages: 0, totalRecords: 0 });
    const fetchPage = jest.fn().mockResolvedValue(empty);

    const result = await fetchPageWithLastPageFallback(fetchPage, 1);

    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ response: empty, page: 1 });
  });

  it("does not refetch when a page past the end of an empty data set is requested", async () => {
    const fetchPage = jest
      .fn()
      .mockResolvedValue(pageResponse([], { page: 5, totalPages: 0 }));

    const result = await fetchPageWithLastPageFallback(fetchPage, 5);

    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(result.page).toBe(5);
    expect(result.requestedPage).toBeUndefined();
  });

  it("fetches the last page when a page past the end is requested", async () => {
    const lastPage = pageResponse(["z"], { page: 3, totalPages: 3 });
    const fetchPage = jest
      .fn()
      .mockResolvedValueOnce(pageResponse([], { page: 7, totalPages: 3 }))
      .mockResolvedValueOnce(lastPage);

    const result = await fetchPageWithLastPageFallback(fetchPage, 7);

    expect(fetchPage).toHaveBeenNthCalledWith(1, 7);
    expect(fetchPage).toHaveBeenNthCalledWith(2, 3);
    expect(result).toEqual({ response: lastPage, page: 3, requestedPage: 7 });
  });

  it("only retries once, even if the last page also comes back empty", async () => {
    const fetchPage = jest
      .fn()
      .mockResolvedValueOnce(pageResponse([], { page: 7, totalPages: 3 }))
      .mockResolvedValueOnce(pageResponse([], { page: 3, totalPages: 2 }));

    const result = await fetchPageWithLastPageFallback(fetchPage, 7);

    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(result.page).toBe(3);
    expect(result.response.data).toEqual([]);
  });

  it("tolerates a missing pagination_info", async () => {
    const fetchPage = jest.fn().mockResolvedValue({ data: [] });

    const result = await fetchPageWithLastPageFallback(fetchPage, 2);

    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(result.page).toBe(2);
  });

  it("propagates errors from the first fetch", async () => {
    const fetchPage = jest.fn().mockRejectedValue(new Error("boom"));

    await expect(fetchPageWithLastPageFallback(fetchPage, 1)).rejects.toThrow(
      "boom",
    );
  });

  it("propagates errors from the last page fetch", async () => {
    const fetchPage = jest
      .fn()
      .mockResolvedValueOnce(pageResponse([], { page: 4, totalPages: 2 }))
      .mockRejectedValueOnce(new Error("second boom"));

    await expect(fetchPageWithLastPageFallback(fetchPage, 4)).rejects.toThrow(
      "second boom",
    );
  });
});
