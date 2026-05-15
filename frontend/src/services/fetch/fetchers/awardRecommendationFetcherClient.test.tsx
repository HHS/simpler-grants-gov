import { getAwardRecommendationRisks } from "./awardRecommendationFetcherClient";

global.fetch = jest.fn();

describe("getAwardRecommendationRisks", () => {
  it("fetches and returns risks and pagination info", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        data: [{ id: 1 }],
        pagination_info: { total_pages: 1 },
      }),
    });
    const result = await getAwardRecommendationRisks(
      "award-id",
      { page_offset: 1, page_size: 10, sort_order: [] },
      "token",
    );
    expect(result.risks).toEqual([{ id: 1 }]);
    expect(result.paginationInfo).toEqual({ total_pages: 1 });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("award-id"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "X-SGG-Token": "token" }),
      }),
    );
  });

  it("handles fetch error", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("fail"));
    await expect(
      getAwardRecommendationRisks(
        "award-id",
        { page_offset: 1, page_size: 10, sort_order: [] },
        "token",
      ),
    ).rejects.toThrow("fail");
  });
});
