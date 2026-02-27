import { getAwardRecommendationDetails } from "src/services/fetch/fetchers/awardRecommendationFetcher";
import { mockAwardRecommendationDetails } from "src/utils/testing/fixtures";

describe("getAwardRecommendationDetails", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns the expected mock details", async () => {
    const result = await getAwardRecommendationDetails("an id");

    expect(result).toEqual(mockAwardRecommendationDetails);
  });
});
