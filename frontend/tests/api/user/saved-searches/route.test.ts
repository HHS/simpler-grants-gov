/**
 * @jest-environment node
 */

import { POST } from "src/app/api/user/saved-searches/route";

import { NextRequest } from "next/server";

const getSessionMock = jest.fn();

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => getSessionMock(),
}));

const mockHandleSavedSearch = jest.fn((...params: unknown[]): unknown => {
  if (params[3] === "give me a 501") {
    return Promise.resolve({ status_code: 501 });
  }
  if (params[3] === "give me an error") {
    throw new Error("fake error hi");
  }
  return Promise.resolve({ status_code: 200 });
});

jest.mock("src/services/fetch/fetchers/savedSearchFetcher", () => ({
  handleSavedSearch: (...args: unknown[]) => mockHandleSavedSearch(...args),
}));

const fakeRequestForSavedSearch = (
  nameOverride?: string,
  saveSearchOverride = {},
) => {
  return {
    json: async () => {
      return Promise.resolve({
        status: "forecasted,posted,archived,closed",
        eligibility: "state_governments",
        query: "simpler",
        category: "recovery_act",
        agency: "CPSC",
        fundingInstrument: "cooperative_agreement",
        sortby: "closeDateAsc",
        ...saveSearchOverride,
        name:
          nameOverride === undefined ? "a very special search" : nameOverride,
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
    const response = await POST(fakeRequestForSavedSearch());
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
    const response = await POST(fakeRequestForSavedSearch());
    expect(response.status).toBe(401);
    expect(mockHandleSavedSearch).toHaveBeenCalledTimes(0);
  });

  it("returns an error if name is not provided", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));
    const response = await POST(fakeRequestForSavedSearch(""));
    expect(response.status).toBe(400);
    expect(mockHandleSavedSearch).toHaveBeenCalledTimes(0);
  });

  it("returns an error on non 200 response from API", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));
    const response = await POST(fakeRequestForSavedSearch("give me a 501"));
    expect(response.status).toBe(501);
    expect(mockHandleSavedSearch).toHaveBeenCalledTimes(1);
  });

  it("returns an error on API error", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));
    const response = await POST(fakeRequestForSavedSearch("give me an error"));
    expect(response.status).toBe(500);
    expect(mockHandleSavedSearch).toHaveBeenCalledTimes(1);
  });
});
