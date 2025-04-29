/**
 * @jest-environment node
 */

import { getSavedOpportunityHandler } from "src/app/api/user/saved-opportunities/[id]/handler";

const getSessionMock = jest.fn();

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => getSessionMock(),
}));

const mockPostSavedOpp = jest.fn((params: unknown): unknown => params);

jest.mock("src/services/fetch/fetchers/savedOpportunityFetcher", () => ({
  getSavedOpportunity: (
    _token: string,
    _userId: number,
    opportunityId: number,
  ) => mockPostSavedOpp(opportunityId ? { opportunity_id: 1 } : null),
}));

describe("GET request", () => {
  afterEach(() => jest.clearAllMocks());
  it("gets a saved opportunity", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));

    const response = await getSavedOpportunityHandler(
      new Request("http://simpler.grants.gov"),
      {
        params: Promise.resolve({ id: "1" }),
      },
    );
    const json = (await response.json()) as { opportunity_id: number };
    expect(response.status).toBe(200);
    expect(mockPostSavedOpp).toHaveBeenCalledTimes(1);
    expect(json.opportunity_id).toBe(1);
    expect(getSessionMock).toHaveBeenCalledTimes(1);
  });

  it("unauthorized getting a saved opportunity", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "",
    }));

    const response = await getSavedOpportunityHandler(
      new Request("http://simpler.grants.gov"),
      {
        params: Promise.resolve({ id: "1" }),
      },
    );
    expect(response.status).toBe(401);
    expect(mockPostSavedOpp).toHaveBeenCalledTimes(0);
  });

  it("getting an empty saved opportunity", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));

    const response = await getSavedOpportunityHandler(
      new Request("http://simpler.grants.gov"),
      {
        params: Promise.resolve({ id: "" }),
      },
    );
    const json = (await response.json()) as null;
    expect(response.status).toBe(200);
    expect(mockPostSavedOpp).toHaveBeenCalledTimes(1);
    expect(json).toBeNull();
  });
});
