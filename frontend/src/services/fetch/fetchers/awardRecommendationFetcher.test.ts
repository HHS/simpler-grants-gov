import { getAwardRecommendationDetails } from "src/services/fetch/fetchers/awardRecommendationFetcher";
import { APIResponse } from "src/types/apiResponseTypes";
import { mockAwardRecommendationDetails } from "src/utils/testing/fixtures";

const mockJson = jest.fn().mockResolvedValue({
  data: mockAwardRecommendationDetails,
} as APIResponse);

const mockFetchAwardRecommendation = jest.fn().mockResolvedValue({
  json: mockJson,
});

jest.mock("src/services/fetch/fetchers/fetchers", () => ({
  fetchAwardRecommendation: (params: unknown) =>
    mockFetchAwardRecommendation(params),
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
