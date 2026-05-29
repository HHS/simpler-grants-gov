import {
  getAwardRecommendationDetails,
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
const mockFetchAwardRecommendationWithMethod = jest.fn().mockResolvedValue({
  json: jest.fn().mockResolvedValue({
    data: mockAwardRecommendationSubmissions,
  } as APIResponse),
});

jest.mock("src/services/fetch/fetchers/fetchers", () => ({
  fetchAwardRecommendation: (params: unknown): Promise<Response> =>
    mockFetchAwardRecommendation(params) as Promise<Response>,
  fetchAwardRecommendationWithMethod: (_type: "POST" | "PUT") =>
    mockFetchAwardRecommendationWithMethod,
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

    expect(mockFetchAwardRecommendationWithMethod).toHaveBeenCalledWith({
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
