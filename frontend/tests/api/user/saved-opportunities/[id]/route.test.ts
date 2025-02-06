/**
 * @jest-environment node
 */

import { GET } from "src/app/api/user/saved-opportunities/[id]/route";

const getSessionMock = jest.fn();

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => getSessionMock(),
}));

const mockPostSavedOpp = jest.fn((params: unknown): unknown => params);

jest.mock("src/services/fetch/fetchers/savedOpportunityFetcher", () => ({
  getSavedOpportunity: () => mockPostSavedOpp({ opportunity_id: 1 }),
}));

describe("GET request", () => {
  afterEach(() => jest.clearAllMocks());
  it("gets a saved opportunity", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));

    const response = await GET(new Request("http://simpler.grants.gov"), {
      params: Promise.resolve({ id: "1" }),
    });
    const json = (await response.json()) as { opportunity_id: number };
    expect(response.status).toBe(200);
    expect(mockPostSavedOpp).toHaveBeenCalledTimes(1);
    expect(json.opportunity_id).toBe(1);
    expect(getSessionMock).toHaveBeenCalledTimes(1);
  });
});
