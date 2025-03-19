import {
  obtainSavedSearches,
  saveSearch,
} from "src/services/fetch/fetchers/clientSavedSearchFetcher";
import { wrapForExpectedError } from "src/utils/testing/commonTestUtils";

import { ReadonlyURLSearchParams } from "next/navigation";

const fetchMock = jest.fn();

describe("saveSearch", () => {
  let originalFetch: typeof global.fetch;
  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = fetchMock;
  });
  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });
  it("returns immediately if there is no token", async () => {
    const result = await saveSearch("a name", new ReadonlyURLSearchParams());
    expect(result).toEqual(undefined);
  });
  it("calls fetch as expected and returns json result", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ arbitrary: "data" }),
    });
    const result = await saveSearch(
      "a name",
      new ReadonlyURLSearchParams([["status", "value"]]),
      "faketoken",
    );

    expect(result).toEqual({ arbitrary: "data" });
    expect(fetchMock).toHaveBeenCalledWith("/api/user/saved-searches", {
      method: "POST",
      body: JSON.stringify({ status: "value", name: "a name" }),
    });
  });
  it("throws on non ok", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 200,
      json: () => Promise.resolve({ arbitrary: "data" }),
    });
    const expectedError = await wrapForExpectedError(() =>
      saveSearch(
        "a name",
        new ReadonlyURLSearchParams([["status", "value"]]),
        "faketoken",
      ),
    );

    expect(expectedError).toBeInstanceOf(Error);
  });

  it("throws on non 200", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 500,
      json: () => Promise.resolve({ arbitrary: "data" }),
    });
    const expectedError = await wrapForExpectedError(() =>
      saveSearch(
        "a name",
        new ReadonlyURLSearchParams([["status", "value"]]),
        "faketoken",
      ),
    );

    expect(expectedError).toBeInstanceOf(Error);
  });
});

describe("obtainSavedSearches", () => {
  let originalFetch: typeof global.fetch;
  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = fetchMock;
  });
  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });
  it("throws if there is no token", async () => {
    const expectedError = await wrapForExpectedError(() =>
      obtainSavedSearches(""),
    );

    expect(expectedError).toBeInstanceOf(Error);
  });
  it("calls fetch as expected and returns json result", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ arbitrary: "data" }),
    });
    const result = await obtainSavedSearches("faketoken");

    expect(result).toEqual({ arbitrary: "data" });
    expect(fetchMock).toHaveBeenCalledWith("/api/user/saved-searches/list", {
      method: "POST",
    });
  });
  it("throws on non ok", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 200,
      json: () => Promise.resolve({ arbitrary: "data" }),
    });
    const expectedError = await wrapForExpectedError(() =>
      obtainSavedSearches("faketoken"),
    );

    expect(expectedError).toBeInstanceOf(Error);
  });

  it("throws on non 200", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 500,
      json: () => Promise.resolve({ arbitrary: "data" }),
    });
    const expectedError = await wrapForExpectedError(() =>
      obtainSavedSearches("faketoken"),
    );

    expect(expectedError).toBeInstanceOf(Error);
  });
});
