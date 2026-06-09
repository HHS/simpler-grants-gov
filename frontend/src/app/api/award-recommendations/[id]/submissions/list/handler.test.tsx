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
const mockSubmissions = [
  { award_recommendation_application_submission_id: "sub-1" },
];
const mockPaginationInfo = { total_pages: 1, total_records: 1 };
const mockFilters = {
  award_recommendation_type: { one_of: ["recommended_for_funding"] as const },
};

const createRequest = (body: Record<string, unknown>) =>
  ({
    json: jest.fn().mockResolvedValue(body),
  }) as unknown as NextRequest;

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
    const req = createRequest({
      pagination: mockPagination,
      filters: mockFilters,
    });
    const params = Promise.resolve({ id: "award-id" });
    const res = await getSubmissionsForAwardRecommendation(req, { params });
    const json = (await res.json()) as {
      data: unknown[];
      pagination_info: unknown;
    };
    expect(
      fetcherModule.listAwardRecommendationSubmissionsPaginated,
    ).toHaveBeenCalledWith("award-id", mockPagination, mockFilters);
    expect(json.data).toEqual(mockSubmissions);
    expect(json.pagination_info).toEqual(mockPaginationInfo);
  });

  it("passes filters to the fetcher when provided", async () => {
    const exceptionFilters = { has_exception: { one_of: [true] } };
    (
      fetcherModule.listAwardRecommendationSubmissionsPaginated as jest.Mock
    ).mockResolvedValue({
      submissions: mockSubmissions,
      paginationInfo: mockPaginationInfo,
    });

    const res = await getSubmissionsForAwardRecommendation(
      createRequest({ pagination: mockPagination, filters: exceptionFilters }),
      { params: Promise.resolve({ id: "award-id" }) },
    );

    expect(res.status).toBe(200);
    expect(
      fetcherModule.listAwardRecommendationSubmissionsPaginated,
    ).toHaveBeenCalledWith("award-id", mockPagination, exceptionFilters);
  });

  it("calls the fetcher without filters when none are provided", async () => {
    (
      fetcherModule.listAwardRecommendationSubmissionsPaginated as jest.Mock
    ).mockResolvedValue({
      submissions: mockSubmissions,
      paginationInfo: mockPaginationInfo,
    });

    const res = await getSubmissionsForAwardRecommendation(
      createRequest({ pagination: mockPagination }),
      { params: Promise.resolve({ id: "award-id" }) },
    );

    expect(res.status).toBe(200);
    expect(
      fetcherModule.listAwardRecommendationSubmissionsPaginated,
    ).toHaveBeenCalledWith("award-id", mockPagination, undefined);
  });

  it("returns 500 when award recommendation ID is missing", async () => {
    const res = await getSubmissionsForAwardRecommendation(
      createRequest({ pagination: mockPagination }),
      { params: Promise.resolve({ id: "" }) },
    );
    const json = (await res.json()) as { message: string };

    expect(res.status).toBe(500);
    expect(json.message).toBe(
      "Error attempting to fetch award recommendation submissions: Award recommendation ID is required",
    );
    expect(
      fetcherModule.listAwardRecommendationSubmissionsPaginated,
    ).not.toHaveBeenCalled();
  });

  it("returns 500 when pagination is missing", async () => {
    const res = await getSubmissionsForAwardRecommendation(createRequest({}), {
      params: Promise.resolve({ id: "award-id" }),
    });
    const json = (await res.json()) as { message: string };

    expect(res.status).toBe(500);
    expect(json.message).toBe(
      "Error attempting to fetch award recommendation submissions: Pagination information is required",
    );
    expect(
      fetcherModule.listAwardRecommendationSubmissionsPaginated,
    ).not.toHaveBeenCalled();
  });

  it("returns 500 when the fetcher throws", async () => {
    (
      fetcherModule.listAwardRecommendationSubmissionsPaginated as jest.Mock
    ).mockRejectedValue(new Error("API failure"));

    const res = await getSubmissionsForAwardRecommendation(
      createRequest({ pagination: mockPagination }),
      { params: Promise.resolve({ id: "award-id" }) },
    );
    const json = (await res.json()) as { message: string };

    expect(res.status).toBe(500);
    expect(json.message).toBe(
      "Error attempting to fetch award recommendation submissions: API failure",
    );
  });
});
