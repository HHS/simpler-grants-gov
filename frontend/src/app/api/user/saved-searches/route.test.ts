/**
 * @jest-environment node
 */

import {
  deleteSearchHandler,
  saveSearchHandler,
  updateSavedSearchHandler,
} from "src/app/api/user/saved-searches/handler";
import { fakeSearchParamDict } from "src/utils/testing/fixtures";

import { NextRequest } from "next/server";

const mockAPIFetchImplementation =
  (paramIndexToWatch: number) =>
  (...params: unknown[]): unknown => {
    if (params[paramIndexToWatch] === "give me a 501") {
      return Promise.resolve({ status_code: 501 });
    }
    if (params[paramIndexToWatch] === "give me an error") {
      throw new Error("fake error hi");
    }
    return Promise.resolve({ status_code: 200 });
  };

const getSessionMock = jest.fn();

const mockHandleSavedSearch = jest.fn(mockAPIFetchImplementation(3));
const mockHandleDeleteSavedSearch = jest.fn(mockAPIFetchImplementation(2));
const mockHandleUpdateSavedSearch = jest.fn(mockAPIFetchImplementation(3));

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => getSessionMock(),
}));

jest.mock("src/services/fetch/fetchers/savedSearchFetcher", () => ({
  handleSavedSearch: (...args: unknown[]) => mockHandleSavedSearch(...args),
  handleDeleteSavedSearch: (...args: unknown[]) =>
    mockHandleDeleteSavedSearch(...args),
  handleUpdateSavedSearch: (...args: unknown[]) =>
    mockHandleUpdateSavedSearch(...args),
}));

const fakeRequestForSavedSearch = (
  nameOverride?: string,
  saveSearchOverride = {},
) => {
  return {
    json: async () => {
      return Promise.resolve({
        ...fakeSearchParamDict,
        ...saveSearchOverride,
        name:
          nameOverride === undefined ? "a very special search" : nameOverride,
      });
    },
  } as unknown as NextRequest;
};

const fakeRequestForUpdateSearch = (nameOverride?: string) => {
  return {
    json: async () => {
      return Promise.resolve({
        name:
          nameOverride === undefined ? "a very special search" : nameOverride,
        searchId: "1",
      });
    },
  } as unknown as NextRequest;
};

const fakeRequestForDeleteSearch = (idOverride?: string) => {
  return {
    json: async () => {
      return Promise.resolve({
        searchId: idOverride === undefined ? "1" : idOverride,
      });
    },
  } as unknown as NextRequest;
};

describe("saved searches POST request", () => {
  afterEach(() => jest.clearAllMocks());
  it("sends back expected information on successful save", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));
    const response = await saveSearchHandler(fakeRequestForSavedSearch());
    const json = (await response.json()) as { message: string };

    expect(response.status).toBe(200);
    expect(mockHandleSavedSearch).toHaveBeenCalledTimes(1);
    expect(json.message).toBe("Saved search success");
    expect(getSessionMock).toHaveBeenCalledTimes(1);
  });

  it("returns an error if session token is absent", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "",
    }));
    const response = await saveSearchHandler(fakeRequestForSavedSearch());
    expect(response.status).toBe(401);
    expect(mockHandleSavedSearch).toHaveBeenCalledTimes(0);
  });

  it("returns an error if name is not provided", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));
    const response = await saveSearchHandler(fakeRequestForSavedSearch(""));
    expect(response.status).toBe(400);
    expect(mockHandleSavedSearch).toHaveBeenCalledTimes(0);
  });

  it("returns an error on non 200 response from API", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));
    const response = await saveSearchHandler(
      fakeRequestForSavedSearch("give me a 501"),
    );
    expect(response.status).toBe(501);
    expect(mockHandleSavedSearch).toHaveBeenCalledTimes(1);
  });

  it("returns an error on API error", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));
    const response = await saveSearchHandler(
      fakeRequestForSavedSearch("give me an error"),
    );
    expect(response.status).toBe(500);
    expect(mockHandleSavedSearch).toHaveBeenCalledTimes(1);
  });
});

describe("saved searches PUT request", () => {
  afterEach(() => jest.clearAllMocks());
  it("sends back expected information on successful update", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));
    const response = await updateSavedSearchHandler(
      fakeRequestForUpdateSearch(),
    );
    const json = (await response.json()) as { message: string };

    expect(response.status).toBe(200);
    expect(mockHandleUpdateSavedSearch).toHaveBeenCalledTimes(1);
    expect(json.message).toBe("Update search success");
    expect(getSessionMock).toHaveBeenCalledTimes(1);
  });

  it("returns an error if session token is absent", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "",
    }));
    const response = await updateSavedSearchHandler(
      fakeRequestForUpdateSearch(),
    );
    expect(response.status).toBe(401);
    expect(mockHandleUpdateSavedSearch).toHaveBeenCalledTimes(0);
  });

  it("returns an error if name is not provided", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));
    const response = await updateSavedSearchHandler(
      fakeRequestForUpdateSearch(""),
    );
    expect(response.status).toBe(400);
    expect(mockHandleUpdateSavedSearch).toHaveBeenCalledTimes(0);
  });

  it("returns an error on non 200 response from API", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));
    const response = await updateSavedSearchHandler(
      fakeRequestForUpdateSearch("give me a 501"),
    );
    expect(response.status).toBe(501);
    expect(mockHandleUpdateSavedSearch).toHaveBeenCalledTimes(1);
  });

  it("returns an error on API error", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));
    const response = await updateSavedSearchHandler(
      fakeRequestForUpdateSearch("give me an error"),
    );
    expect(response.status).toBe(500);
    expect(mockHandleUpdateSavedSearch).toHaveBeenCalledTimes(1);
  });
});

describe("saved searches DELETE request", () => {
  afterEach(() => jest.clearAllMocks());
  it("sends back expected information on successful update", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));
    const response = await deleteSearchHandler(fakeRequestForDeleteSearch());
    const json = (await response.json()) as { message: string };

    expect(response.status).toBe(200);
    expect(mockHandleDeleteSavedSearch).toHaveBeenCalledTimes(1);
    expect(json.message).toBe("Delete search success");
    expect(getSessionMock).toHaveBeenCalledTimes(1);
  });

  it("returns an error if session token is absent", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "",
    }));
    const response = await deleteSearchHandler(fakeRequestForDeleteSearch());
    expect(response.status).toBe(401);
    expect(mockHandleDeleteSavedSearch).toHaveBeenCalledTimes(0);
  });

  it("returns an error if name is not provided", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));
    const response = await deleteSearchHandler(fakeRequestForDeleteSearch(""));
    expect(response.status).toBe(400);
    expect(mockHandleDeleteSavedSearch).toHaveBeenCalledTimes(0);
  });

  it("returns an error on non 200 response from API", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));
    const response = await deleteSearchHandler(
      fakeRequestForDeleteSearch("give me a 501"),
    );
    expect(response.status).toBe(501);
    expect(mockHandleDeleteSavedSearch).toHaveBeenCalledTimes(1);
  });

  it("returns an error on API error", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));
    const response = await deleteSearchHandler(
      fakeRequestForDeleteSearch("give me an error"),
    );
    expect(response.status).toBe(500);
    expect(mockHandleDeleteSavedSearch).toHaveBeenCalledTimes(1);
  });
});
