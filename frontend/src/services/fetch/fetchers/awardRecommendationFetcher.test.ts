import { getAwardRecommendationDetails } from "src/services/fetch/fetchers/awardRecommendationFetcher";

describe("getAwardRecommendationDetails", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns the expected mock details", async () => {
    const result = await getAwardRecommendationDetails();

    expect(result).toEqual({
      recordNumber: "AR-26-0002",
      datePrepared: "01/08/2026",
      status: "draft",
    });
  });
});
