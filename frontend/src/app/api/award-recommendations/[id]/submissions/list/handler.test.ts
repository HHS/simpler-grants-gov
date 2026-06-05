import * as fetchersModule from "src/services/fetch/fetchers/fetchers";

import { NextRequest } from "next/server";

import { listAwardRecommendationSubmissions } from "./handler";

jest.mock("src/services/fetch/fetchers/fetchers");

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

const mockSubmissions = [
  {
    award_recommendation_application_submission_id: "sub-1",
    application_submission: {
      application_submission_id: "app-1",
      application_submission_number: "APP-001",
      project_title: "Project 1",
    },
    submission_detail: {
      award_recommendation_type: "recommended_for_funding",
      recommended_amount: "50000",
    },
  },
  {
    award_recommendation_application_submission_id: "sub-2",
    application_submission: {
      application_submission_id: "app-2",
      application_submission_number: "APP-002",
      project_title: "Project 2",
    },
    submission_detail: {
      award_recommendation_type: "not_recommended",
    },
  },
];

const mockApiResponse = {
  data: mockSubmissions,
  pagination_info: {
    page_offset: 1,
    page_size: 10,
    total_pages: 1,
    total_records: 2,
  },
};

const mockPagination = {
  page_offset: 1,
  page_size: 10,
  sort_order: [
    {
      order_by: "application_submission_number",
      sort_direction: "ascending" as const,
    },
  ],
};

describe("listAwardRecommendationSubmissions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns paginated submissions successfully", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue(mockApiResponse),
    });
    (
      fetchersModule.fetchAwardRecommendationWithMethod as jest.Mock
    ).mockReturnValue(mockFetch);

    const req = {
      json: jest.fn().mockResolvedValue({ pagination: mockPagination }),
    } as unknown as NextRequest;
    const params = Promise.resolve({ id: "award-id" });

    const res = await listAwardRecommendationSubmissions(req, { params });
    const json = (await res.json()) as {
      data: unknown[];
      pagination_info: { total_pages: number; total_records: number };
    };

    expect(
      fetchersModule.fetchAwardRecommendationWithMethod,
    ).toHaveBeenCalledWith("POST");
    expect(mockFetch).toHaveBeenCalledWith({
      subPath: "award-id/submissions/list",
      body: { pagination: mockPagination },
    });
    expect(json.data).toEqual(mockSubmissions);
    expect(json.pagination_info.total_records).toBe(2);
    expect(json.pagination_info.total_pages).toBe(1);
  });

  it("handles pagination correctly with multiple pages", async () => {
    const manySubmissions = Array.from({ length: 10 }, (_, i) => ({
      award_recommendation_application_submission_id: `sub-${i}`,
      application_submission: {
        application_submission_id: `app-${i}`,
        application_submission_number: `APP-${String(i).padStart(3, "0")}`,
        project_title: `Project ${i}`,
      },
    }));

    const mockMultiPageResponse = {
      data: manySubmissions,
      pagination_info: {
        page_offset: 1,
        page_size: 10,
        total_pages: 3,
        total_records: 25,
      },
    };

    const mockFetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue(mockMultiPageResponse),
    });
    (
      fetchersModule.fetchAwardRecommendationWithMethod as jest.Mock
    ).mockReturnValue(mockFetch);

    const req = {
      json: jest.fn().mockResolvedValue({ pagination: mockPagination }),
    } as unknown as NextRequest;
    const params = Promise.resolve({ id: "award-id" });

    const res = await listAwardRecommendationSubmissions(req, { params });
    const json = (await res.json()) as {
      data: unknown[];
      pagination_info: { total_pages: number; total_records: number };
    };

    expect(json.data).toHaveLength(10);
    expect(json.pagination_info.total_records).toBe(25);
    expect(json.pagination_info.total_pages).toBe(3);
  });

  it("returns second page of results", async () => {
    const page2Submissions = Array.from({ length: 10 }, (_, i) => ({
      award_recommendation_application_submission_id: `sub-${i + 10}`,
      application_submission: {
        application_submission_id: `app-${i + 10}`,
        application_submission_number: `APP-${String(i + 10).padStart(3, "0")}`,
        project_title: `Project ${i + 10}`,
      },
    }));

    const mockPage2Response = {
      data: page2Submissions,
      pagination_info: {
        page_offset: 2,
        page_size: 10,
        total_pages: 3,
        total_records: 25,
      },
    };

    const mockFetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue(mockPage2Response),
    });
    (
      fetchersModule.fetchAwardRecommendationWithMethod as jest.Mock
    ).mockReturnValue(mockFetch);

    const page2Pagination = { ...mockPagination, page_offset: 2 };
    const req = {
      json: jest.fn().mockResolvedValue({ pagination: page2Pagination }),
    } as unknown as NextRequest;
    const params = Promise.resolve({ id: "award-id" });

    const res = await listAwardRecommendationSubmissions(req, { params });
    const json = (await res.json()) as {
      data: Array<{ award_recommendation_application_submission_id: string }>;
    };

    expect(mockFetch).toHaveBeenCalledWith({
      subPath: "award-id/submissions/list",
      body: { pagination: page2Pagination },
    });
    expect(json.data).toHaveLength(10);
    expect(json.data[0].award_recommendation_application_submission_id).toBe(
      "sub-10",
    );
  });

  it("throws error if award recommendation ID is missing", async () => {
    const req = {
      json: jest.fn().mockResolvedValue({ pagination: mockPagination }),
    } as unknown as NextRequest;
    const params = Promise.resolve({ id: "" });

    const res = await listAwardRecommendationSubmissions(req, { params });
    expect(res.status).toBe(500);
  });

  it("throws error if pagination is missing", async () => {
    const req = {
      json: jest.fn().mockResolvedValue({}),
    } as unknown as NextRequest;
    const params = Promise.resolve({ id: "award-id" });

    const res = await listAwardRecommendationSubmissions(req, { params });
    expect(res.status).toBe(500);
  });
});
