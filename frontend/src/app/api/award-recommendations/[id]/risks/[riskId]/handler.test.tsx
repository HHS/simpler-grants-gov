import { NextRequest } from "next/server";

import { deleteRiskForAwardRecommendation } from "./handler";

global.Response = class Response {
  constructor(public body: any, public init?: ResponseInit) {}
  static json(data: any, init?: ResponseInit) {
    return {
      json: async () => data,
      status: init?.status || 200,
      ...init,
    };
  }
} as any;

jest.mock("src/services/auth/session", () => ({ getSession: jest.fn() }));
jest.mock(
  "src/services/fetch/fetchers/awardRecommendationFetcherClient",
  () => ({ deleteAwardRecommendationRisk: jest.fn() }),
);

const mockSession = { token: "test-token" };

describe("deleteRiskForAwardRecommendation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deletes risk successfully", async () => {
    require("src/services/auth/session").getSession.mockResolvedValue(
      mockSession,
    );
    require("src/services/fetch/fetchers/awardRecommendationFetcherClient").deleteAwardRecommendationRisk.mockResolvedValue(
      { success: true, message: "Risk deleted" },
    );
    const req = {} as unknown as NextRequest;
    const params = Promise.resolve({ id: "award-id", riskId: "risk-id" });
    const res = await deleteRiskForAwardRecommendation(req, { params });
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.message).toBe("Risk deleted");
  });

  it("throws error if no session", async () => {
    require("src/services/auth/session").getSession.mockResolvedValue(null);
    const req = {} as unknown as NextRequest;
    const params = Promise.resolve({ id: "award-id", riskId: "risk-id" });
    const res = await deleteRiskForAwardRecommendation(req, { params });
    expect(res.status).toBe(401);
  });

  it("throws error if award recommendation ID is missing", async () => {
    require("src/services/auth/session").getSession.mockResolvedValue(
      mockSession,
    );
    const req = {} as unknown as NextRequest;
    const params = Promise.resolve({ id: "", riskId: "risk-id" });
    const res = await deleteRiskForAwardRecommendation(req, { params });
    expect(res.status).toBe(500);
  });

  it("throws error if risk ID is missing", async () => {
    require("src/services/auth/session").getSession.mockResolvedValue(
      mockSession,
    );
    const req = {} as unknown as NextRequest;
    const params = Promise.resolve({ id: "award-id", riskId: "" });
    const res = await deleteRiskForAwardRecommendation(req, { params });
    expect(res.status).toBe(500);
  });
});
