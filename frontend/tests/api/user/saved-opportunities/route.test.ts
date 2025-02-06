/**
 * @jest-environment node
 */

import { DELETE, POST } from "src/app/api/user/saved-opportunities/route";

import { NextRequest } from "next/server";

const getSessionMock = jest.fn();

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => getSessionMock(),
}));

const mockPostSavedOpp = jest.fn((params: unknown): unknown => params);

jest.mock("src/services/fetch/fetchers/savedOpportunityFetcher", () => ({
  handleSavedOpportunity: () =>
    mockPostSavedOpp({ status_code: 200 }),
}));

const fakeRequestForSavedOpps = () => {
  return {
    headers: {
      get: jest.fn(() => {return {
        "opportunity_id": 1
      }}),
    },
  } as unknown as NextRequest;
};

describe("POST request", () => {
  afterEach(() => jest.clearAllMocks());
  it("saves saved opportunity", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));

    const response = await POST(fakeRequestForSavedOpps());

    const json = await response.json() as {'message': string};
    expect(response.status).toBe(200);
    expect(mockPostSavedOpp).toHaveBeenCalledTimes(1);

    expect(json.message).toBe("save saved opportunity success");
    expect(getSessionMock).toHaveBeenCalledTimes(1);
  });

  it("deletes saved opportunity", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));

    const response = await DELETE(fakeRequestForSavedOpps());

    const json = await response.json() as {'message': string};
    expect(response.status).toBe(200);
    expect(mockPostSavedOpp).toHaveBeenCalledTimes(1);

    expect(json.message).toBe("delete saved opportunity success");
    expect(getSessionMock).toHaveBeenCalledTimes(1);
  });
});
