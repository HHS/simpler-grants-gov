import {
  deleteAwardRecommendationRisk,
  getAwardRecommendationDetails,
  getAwardRecommendationRisks,
  getAwardRecommendationSubmission,
  listAwardRecommendationSubmissions,
  listAwardRecommendationSubmissionsPaginated,
  updateAwardRecommendationSubmissionDetails,
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
    expect(result).toEqual(mockAwardRecommendationDetails);
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

describe("listAwardRecommendationSubmissionsPaginated", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("calls fetchAwardRecommendationWithMethod with pagination and filters", async () => {
    await listAwardRecommendationSubmissionsPaginated(
      "an id",
      {
        page_offset: 2,
        page_size: 10,
        sort_order: [],
      },
      {
        award_recommendation_type: { one_of: ["recommended_for_funding"] },
      },
    );

    expect(mockInnerFetch).toHaveBeenCalledWith({
      subPath: "an id/submissions/list",
      body: {
        filters: {
          award_recommendation_type: { one_of: ["recommended_for_funding"] },
        },
        pagination: {
          page_offset: 2,
          page_size: 10,
          sort_order: [],
        },
      },
    });
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

describe("updateAwardRecommendationSubmissionDetails", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("calls fetchAwardRecommendationWithMethod with the correct arguments", async () => {
    const submissionId =
      mockAwardRecommendationSubmissions[0]
        .award_recommendation_application_submission_id;

    await updateAwardRecommendationSubmissionDetails("an id", {
      [submissionId]: {
        award_recommendation_type: "recommended_for_funding",
        recommended_amount: "50000.00",
        has_exception: false,
      },
    });

    expect(mockInnerFetch).toHaveBeenCalledWith({
      subPath: "an id/submission-details",
      body: {
        award_recommendation_submissions: {
          [submissionId]: {
            award_recommendation_type: "recommended_for_funding",
            recommended_amount: "50000.00",
            has_exception: false,
          },
        },
      },
    });
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
