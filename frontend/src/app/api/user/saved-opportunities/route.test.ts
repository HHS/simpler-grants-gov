/**
 * @jest-environment node
 */

import { handleSavedOpportunityRequest } from "src/app/api/user/saved-opportunities/handler";

import { NextRequest } from "next/server";

const getSessionMock = jest.fn();

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => getSessionMock(),
}));

const mockPostSavedOpp = jest.fn((params: unknown): unknown =>
  Promise.resolve({ json: () => Promise.resolve(params) }),
);

jest.mock("src/services/fetch/fetchers/savedOpportunityFetcher", () => ({
  handleSavedOpportunity: (
    _type: string,
    _token: string,
    _userId: number,
    opportunityId: number,
  ) =>
    mockPostSavedOpp(
      opportunityId ? { status_code: 200 } : { status_code: 500 },
    ),
}));

const fakeRequestForSavedOpps = (success = true, method: string) => {
  return {
    json: jest.fn(() => {
      return success
        ? Promise.resolve({ opportunityId: "1" })
        : Promise.resolve({ opportunityId: null });
    }),
    method,
  } as unknown as NextRequest;
};

describe("POST and DELETE request", () => {
  afterEach(() => jest.clearAllMocks());
  it("saves saved opportunity", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));
    const response = await handleSavedOpportunityRequest(
      fakeRequestForSavedOpps(true, "POST"),
    );
    const json = (await response.json()) as { message: string };

    expect(response.status).toBe(200);
    expect(mockPostSavedOpp).toHaveBeenCalledTimes(1);
    expect(json.message).toBe("save saved opportunity success");
    expect(getSessionMock).toHaveBeenCalledTimes(1);
  });

  it("rejected saving a saved opportunity", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "",
    }));
    const response = await handleSavedOpportunityRequest(
      fakeRequestForSavedOpps(true, "POST"),
    );
    expect(response.status).toBe(401);
    expect(mockPostSavedOpp).toHaveBeenCalledTimes(0);
  });

  it("error saving a saved opportunity", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));
    const response = await handleSavedOpportunityRequest(
      fakeRequestForSavedOpps(false, "POST"),
    );
    expect(response.status).toBe(500);
    expect(mockPostSavedOpp).toHaveBeenCalledTimes(1);
  });

  it("unauthorized saving a saved opportunity", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "",
    }));
    const response = await handleSavedOpportunityRequest(
      fakeRequestForSavedOpps(true, "POST"),
    );
    expect(response.status).toBe(401);
    expect(mockPostSavedOpp).toHaveBeenCalledTimes(0);
  });

  it("deletes saved opportunity", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));

    const response = await handleSavedOpportunityRequest(
      fakeRequestForSavedOpps(true, "DELETE"),
    );
    const json = (await response.json()) as { message: string };

    expect(response.status).toBe(200);
    expect(mockPostSavedOpp).toHaveBeenCalledTimes(1);
    expect(json.message).toBe("delete saved opportunity success");
    expect(getSessionMock).toHaveBeenCalledTimes(1);
  });

  it("error deleting a saved opportunity", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));
    const response = await handleSavedOpportunityRequest(
      fakeRequestForSavedOpps(false, "DELETE"),
    );
    expect(response.status).toBe(500);
    expect(mockPostSavedOpp).toHaveBeenCalledTimes(1);
  });

  it("unauthorized deleting a saved opportunity", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "",
    }));
    const response = await handleSavedOpportunityRequest(
      fakeRequestForSavedOpps(true, "DELETE"),
    );
    expect(response.status).toBe(401);
    expect(mockPostSavedOpp).toHaveBeenCalledTimes(0);
  });

  it("handleRequest called with wrong method", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));
    const response = await handleSavedOpportunityRequest(
      fakeRequestForSavedOpps(true, "HELP"),
    );

    expect(response.status).toBe(405);
    expect(mockPostSavedOpp).toHaveBeenCalledTimes(0);
  });
});
