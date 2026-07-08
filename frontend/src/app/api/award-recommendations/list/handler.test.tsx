import * as fetcherModule from "src/services/fetch/fetchers/awardRecommendationFetcher";

import { NextRequest } from "next/server";

import { listAwardRecommendations } from "./handler";

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
const mockAwardRecommendations = [{ award_recommendation_id: "ar-1" }];
const mockPaginationInfo = { total_pages: 1, total_records: 1 };

const createRequest = (body: Record<string, unknown>) =>
  ({
    json: jest.fn().mockResolvedValue(body),
  }) as unknown as NextRequest;

describe("listAwardRecommendations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns award recommendations and pagination info on success", async () => {
    (
      fetcherModule.listAwardRecommendationsPaginated as jest.Mock
    ).mockResolvedValue({
      awardRecommendations: mockAwardRecommendations,
      paginationInfo: mockPaginationInfo,
    });

    const res = await listAwardRecommendations(
      createRequest({ pagination: mockPagination, agencyId: "agency-id" }),
    );
    const json = (await res.json()) as {
      data: unknown[];
      pagination_info: unknown;
    };

    expect(
      fetcherModule.listAwardRecommendationsPaginated,
    ).toHaveBeenCalledWith("agency-id", mockPagination);
    expect(json.data).toEqual(mockAwardRecommendations);
    expect(json.pagination_info).toEqual(mockPaginationInfo);
  });

  it("returns 500 when pagination is missing", async () => {
    const res = await listAwardRecommendations(
      createRequest({ agencyId: "agency-id" }),
    );
    const json = (await res.json()) as { message: string };

    expect(res.status).toBe(500);
    expect(json.message).toBe(
      "Error attempting to fetch award recommendations: Pagination information is required",
    );
    expect(
      fetcherModule.listAwardRecommendationsPaginated,
    ).not.toHaveBeenCalled();
  });

  it("returns 500 when agency ID is missing", async () => {
    const res = await listAwardRecommendations(
      createRequest({ pagination: mockPagination }),
    );
    const json = (await res.json()) as { message: string };

    expect(res.status).toBe(500);
    expect(json.message).toBe(
      "Error attempting to fetch award recommendations: Agency ID is required",
    );
    expect(
      fetcherModule.listAwardRecommendationsPaginated,
    ).not.toHaveBeenCalled();
  });

  it("returns 500 when the fetcher throws", async () => {
    (
      fetcherModule.listAwardRecommendationsPaginated as jest.Mock
    ).mockRejectedValue(new Error("API failure"));

    const res = await listAwardRecommendations(
      createRequest({ pagination: mockPagination, agencyId: "agency-id" }),
    );
    const json = (await res.json()) as { message: string };

    expect(res.status).toBe(500);
    expect(json.message).toBe(
      "Error attempting to fetch award recommendations: API failure",
    );
  });
});
