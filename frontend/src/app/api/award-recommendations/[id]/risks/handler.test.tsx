import * as sessionModule from "src/services/auth/session";
import * as fetcherModule from "src/services/fetch/fetchers/awardRecommendationFetcherClient";

import { NextRequest } from "next/server";

import { getRisksForAwardRecommendation } from "./handler";

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
const mockPagination = { page_offset: 1, page_size: 10, sort_order: [] };
const mockRisks = [{ id: 1, type: "ADD_MONITORING" }];
const mockPaginationInfo = { total_pages: 1, total_records: 1 };

describe("getRisksForAwardRecommendation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns risks and pagination info on success", async () => {
    (sessionModule.getSession as jest.Mock).mockResolvedValue(mockSession);
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

  it("throws error if no session", async () => {
    (sessionModule.getSession as jest.Mock).mockResolvedValue(null);
    const req = {
      json: jest.fn().mockResolvedValue({ pagination: mockPagination }),
    } as unknown as NextRequest;
    const params = Promise.resolve({ id: "award-id" });
    const res = await getRisksForAwardRecommendation(req, { params });
    expect(res.status).toBe(401);
  });
});
