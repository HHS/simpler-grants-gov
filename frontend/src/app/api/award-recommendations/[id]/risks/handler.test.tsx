import * as fetcherModule from "src/services/fetch/fetchers/awardRecommendationFetcher";

import { NextRequest } from "next/server";

import { getRisksForAwardRecommendation } from "./handler";

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

const mockPagination = { page_offset: 1, page_size: 10, sort_order: [] };
const mockRisks = [{ id: 1, type: "ADD_MONITORING" }];
const mockPaginationInfo = { total_pages: 1, total_records: 1 };

describe("getRisksForAwardRecommendation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns risks and pagination info on success", async () => {
    (fetcherModule.getAwardRecommendationRisks as jest.Mock).mockResolvedValue({
      risks: mockRisks,
      paginationInfo: mockPaginationInfo,
    });
    const req = {
      json: jest.fn().mockResolvedValue({ pagination: mockPagination }),
    } as unknown as NextRequest;
    const params = Promise.resolve({ id: "award-id" });
    const res = await getRisksForAwardRecommendation(req, { params });
    const json = (await res.json()) as {
      data: unknown[];
      pagination_info: unknown;
    };
    expect(json.data).toEqual(mockRisks);
    expect(json.pagination_info).toEqual(mockPaginationInfo);
  });
});
