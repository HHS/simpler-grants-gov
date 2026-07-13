import * as fetcherModule from "src/services/fetch/fetchers/awardRecommendationFetcher";

import { NextRequest } from "next/server";

import { deleteAwardRecommendationById } from "./handler";

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

describe("deleteAwardRecommendationById", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns success response when delete is successful", async () => {
    (fetcherModule.deleteAwardRecommendation as jest.Mock).mockResolvedValue({
      success: true,
      message: "Deleted",
    });
    const req = {} as unknown as NextRequest;
    const params = Promise.resolve({ id: "award-rec-id" });
    const res = await deleteAwardRecommendationById(req, { params });
    const json = (await res.json()) as { success: boolean; message: string };

    expect(fetcherModule.deleteAwardRecommendation).toHaveBeenCalledWith(
      "award-rec-id",
    );
    expect(json.success).toBe(true);
    expect(json.message).toBe("Deleted");
  });

  it("returns 500 when award recommendation ID is missing", async () => {
    const req = {} as unknown as NextRequest;
    const params = Promise.resolve({ id: "" });
    const res = await deleteAwardRecommendationById(req, { params });

    expect(res.status).toBe(500);
  });
});
