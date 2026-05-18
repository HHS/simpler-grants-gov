import * as sessionModule from "src/services/auth/session";
import * as fetcherModule from "src/services/fetch/fetchers/awardRecommendationFetcherClient";

import { NextRequest } from "next/server";

import { deleteRiskForAwardRecommendation } from "./handler";

jest.mock("src/services/auth/sessionUtils", () => ({}));
jest.mock("src/services/auth/session");
jest.mock("src/services/fetch/fetchers/awardRecommendationFetcherClient");

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

const mockSession = { token: "test-token" };

describe("deleteRiskForAwardRecommendation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deletes risk successfully", async () => {
    (sessionModule.getSession as jest.Mock).mockResolvedValue(mockSession);
    (
      fetcherModule.deleteAwardRecommendationRisk as jest.Mock
    ).mockResolvedValue({ success: true, message: "Risk deleted" });
    const req = {} as unknown as NextRequest;
    const params = Promise.resolve({ id: "award-id", riskId: "risk-id" });
    const res = await deleteRiskForAwardRecommendation(req, { params });
    const json = (await res.json()) as { success: boolean; message: string };
    expect(json.success).toBe(true);
    expect(json.message).toBe("Risk deleted");
  });

  it("throws error if no session", async () => {
    (sessionModule.getSession as jest.Mock).mockResolvedValue(null);
    const req = {} as unknown as NextRequest;
    const params = Promise.resolve({ id: "award-id", riskId: "risk-id" });
    const res = await deleteRiskForAwardRecommendation(req, { params });
    expect(res.status).toBe(401);
  });

  it("throws error if award recommendation ID is missing", async () => {
    (sessionModule.getSession as jest.Mock).mockResolvedValue(mockSession);
    const req = {} as unknown as NextRequest;
    const params = Promise.resolve({ id: "", riskId: "risk-id" });
    const res = await deleteRiskForAwardRecommendation(req, { params });
    expect(res.status).toBe(500);
  });

  it("throws error if risk ID is missing", async () => {
    (sessionModule.getSession as jest.Mock).mockResolvedValue(mockSession);
    const req = {} as unknown as NextRequest;
    const params = Promise.resolve({ id: "award-id", riskId: "" });
    const res = await deleteRiskForAwardRecommendation(req, { params });
    expect(res.status).toBe(500);
  });
});
