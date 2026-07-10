import * as fetcherModule from "src/services/fetch/fetchers/awardRecommendationFetcher";

import { NextRequest } from "next/server";

import { deleteRiskForAwardRecommendation } from "./handler";

jest.mock("src/services/fetch/fetchers/awardRecommendationFetcher");

jest.mock("src/services/auth/sessionUtils", () => ({
  decrypt: jest.fn(),
  encrypt: jest.fn(),
  CLIENT_JWT_ENCRYPTION_ALGORITHM: "HS256",
  API_JWT_ENCRYPTION_ALGORITHM: "RS256",
  newExpirationDate: () => new Date(0),
}));

interface MockResponse {
  json: () => Promise<unknown>;
  status: number;
}

global.Response = class Response {
  constructor(
    public body: unknown,
    public init?: ResponseInit,
  ) {}
  static json(data: unknown, init?: ResponseInit): MockResponse {
    return {
      json: jest.fn().mockResolvedValue(data),
      status: init?.status || 200,
      ...init,
    } as MockResponse;
  }
} as unknown as typeof globalThis.Response;

describe("deleteRiskForAwardRecommendation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns success response when delete is successful", async () => {
    (
      fetcherModule.deleteAwardRecommendationRisk as jest.Mock
    ).mockResolvedValue({ success: true, message: "Risk deleted" });
    const req = {} as unknown as NextRequest;
    const params = Promise.resolve({ id: "award-id", riskId: "risk-id" });
    const res = await deleteRiskForAwardRecommendation(req, { params });
    const json = (await res.json()) as { success: boolean; message: string };
    expect(fetcherModule.deleteAwardRecommendationRisk).toHaveBeenCalledWith(
      "award-id",
      "risk-id",
    );
    expect(json.success).toBe(true);
    expect(json.message).toBe("Risk deleted");
  });

  it("throws error if award recommendation ID is missing", async () => {
    const req = {} as unknown as NextRequest;
    const params = Promise.resolve({ id: "", riskId: "risk-id" });
    const res = await deleteRiskForAwardRecommendation(req, { params });
    expect(res.status).toBe(500);
  });

  it("throws error if risk ID is missing", async () => {
    const req = {} as unknown as NextRequest;
    const params = Promise.resolve({ id: "award-id", riskId: "" });
    const res = await deleteRiskForAwardRecommendation(req, { params });
    expect(res.status).toBe(500);
  });
});
