import {
  deleteAwardRecommendationRisk,
  getAwardRecommendationDetails,
  getAwardRecommendationRisks,
  getAwardRecommendationSubmission,
  listAwardRecommendationSubmissions,
} from "src/services/fetch/fetchers/awardRecommendationFetcher";
import { APIResponse } from "src/types/apiResponseTypes";
import {
  mockAwardRecommendationDetails,
  mockAwardRecommendationSubmissions,
} from "src/utils/testing/fixtures";

const mockJson = jest.fn().mockResolvedValue({
  data: mockAwardRecommendationDetails,
} as APIResponse);

const mockFetchAwardRecommendation = jest.fn().mockResolvedValue({
  json: mockJson,
});
const mockInnerFetch = jest.fn();

jest.mock("src/services/fetch/fetchers/fetchers", () => ({
  fetchAwardRecommendation: (params: unknown): Promise<Response> =>
    mockFetchAwardRecommendation(params) as Promise<Response>,
  fetchAwardRecommendationWithMethod: (
    type: "POST" | "PUT" | "DELETE",
  ): jest.Mock => {
    mockInnerFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        data: type === "POST" ? mockAwardRecommendationSubmissions : null,
        pagination_info: type === "POST" ? { total_pages: 1 } : undefined,
        message: type === "DELETE" ? "Success" : undefined,
      } as APIResponse),
    });
    return mockInnerFetch;
  },
}));

describe("getAwardRecommendationDetails", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("calls fetchAwardRecommendation with the correct arguments", async () => {
    await getAwardRecommendationDetails("an id");
    expect(mockFetchAwardRecommendation).toHaveBeenCalledWith({
      subPath: "an id",
    });
  });

  it("returns the expected award recommendation details", async () => {
    const result = await getAwardRecommendationDetails("an id");
    expect(mockJson).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      ...mockAwardRecommendationDetails,
      award_recommendation_summary:
        mockAwardRecommendationDetails.award_recommendation_summary || {
          total_received_count: 200,
          recommended_for_funding_count: 150,
          recommended_without_funding_count: 25,
          not_recommended_count: 25,
          total_recommended_amount: 250000,
        },
    });
  });
});

describe("listAwardRecommendationSubmissions", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("calls fetchAwardRecommendationWithMethod with the correct arguments", async () => {
    await listAwardRecommendationSubmissions("an id");

    expect(mockInnerFetch).toHaveBeenCalledWith({
      subPath: "an id/submissions/list",
      body: {
        pagination: {
          page_offset: 1,
          page_size: 100,
          sort_order: [
            {
              order_by: "application_submission_number",
              sort_direction: "ascending",
            },
          ],
        },
      },
    });
  });

  it("returns award recommendation submissions", async () => {
    const result = await listAwardRecommendationSubmissions("an id");

    expect(result).toEqual(mockAwardRecommendationSubmissions);
  });
});

describe("getAwardRecommendationSubmission", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns the matching award recommendation submission", async () => {
    const result = await getAwardRecommendationSubmission(
      "an id",
      mockAwardRecommendationSubmissions[0]
        .award_recommendation_application_submission_id,
    );

    expect(result).toEqual(mockAwardRecommendationSubmissions[0]);
  });

  it("returns null when no award recommendation submission matches", async () => {
    const result = await getAwardRecommendationSubmission(
      "an id",
      "not-a-real-id",
    );

    expect(result).toBeNull();
  });
});

describe("getAwardRecommendationRisks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches and returns risks and pagination info", async () => {
    const result = await getAwardRecommendationRisks("award-id", {
      page_offset: 1,
      page_size: 10,
      sort_order: [],
    });
    expect(result.risks).toBeDefined();
    expect(result.paginationInfo).toBeDefined();
    expect(mockInnerFetch).toHaveBeenCalled();
  });
});

describe("deleteAwardRecommendationRisk", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deletes risk successfully", async () => {
    const result = await deleteAwardRecommendationRisk("award-id", "risk-id");
    expect(result.success).toBe(true);
    expect(result.message).toBeDefined();
    expect(mockInnerFetch).toHaveBeenCalled();
  });
});
