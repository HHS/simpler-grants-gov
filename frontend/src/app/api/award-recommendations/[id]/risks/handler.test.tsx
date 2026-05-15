import { NextRequest } from "next/server";

import { getRisksForAwardRecommendation } from "./handler";

global.Response = class Response {
  constructor(
    public body: any,
    public init?: ResponseInit,
  ) {}
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
  () => ({ getAwardRecommendationRisks: jest.fn() }),
);

const mockSession = { token: "test-token" };
const mockPagination = { page_offset: 1, page_size: 10, sort_order: [] };
const mockRisks = [{ id: 1, type: "ADD_MONITORING" }];
const mockPaginationInfo = { total_pages: 1, total_records: 1 };

describe("getRisksForAwardRecommendation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns risks and pagination info on success", async () => {
    require("src/services/auth/session").getSession.mockResolvedValue(
      mockSession,
    );
    require("src/services/fetch/fetchers/awardRecommendationFetcherClient").getAwardRecommendationRisks.mockResolvedValue(
      { risks: mockRisks, paginationInfo: mockPaginationInfo },
    );
    const req = {
      json: async () => ({ pagination: mockPagination }),
    } as unknown as NextRequest;
    const params = Promise.resolve({ id: "award-id" });
    const res = await getRisksForAwardRecommendation(req, { params });
    const json = await res.json();
    expect(json.data).toEqual(mockRisks);
    expect(json.pagination_info).toEqual(mockPaginationInfo);
  });

  it("throws error if no session", async () => {
    require("src/services/auth/session").getSession.mockResolvedValue(null);
    const req = {
      json: async () => ({ pagination: mockPagination }),
    } as unknown as NextRequest;
    const params = Promise.resolve({ id: "award-id" });
    const res = await getRisksForAwardRecommendation(req, { params });
    expect(res.status).toBe(401);
  });
});
