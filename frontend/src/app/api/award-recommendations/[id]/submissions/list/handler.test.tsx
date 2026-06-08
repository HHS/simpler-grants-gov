import * as fetcherModule from "src/services/fetch/fetchers/awardRecommendationFetcher";

import { NextRequest } from "next/server";

import { getSubmissionsForAwardRecommendation } from "./handler";

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
const mockSubmissions = [{ award_recommendation_application_submission_id: "sub-1" }];
const mockPaginationInfo = { total_pages: 1, total_records: 1 };

describe("getSubmissionsForAwardRecommendation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns submissions and pagination info on success", async () => {
    (
      fetcherModule.listAwardRecommendationSubmissionsPaginated as jest.Mock
    ).mockResolvedValue({
      submissions: mockSubmissions,
      paginationInfo: mockPaginationInfo,
    });
    const req = {
      json: jest.fn().mockResolvedValue({
        pagination: mockPagination,
        filters: {
          award_recommendation_type: { one_of: ["recommended_for_funding"] },
        },
      }),
    } as unknown as NextRequest;
    const params = Promise.resolve({ id: "award-id" });
    const res = await getSubmissionsForAwardRecommendation(req, { params });
    const json = (await res.json()) as {
      data: unknown[];
      pagination_info: unknown;
    };
    expect(json.data).toEqual(mockSubmissions);
    expect(json.pagination_info).toEqual(mockPaginationInfo);
  });
});
