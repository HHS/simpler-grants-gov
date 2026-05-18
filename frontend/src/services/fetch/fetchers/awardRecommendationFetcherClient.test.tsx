import {
  deleteAwardRecommendationRisk,
  getAwardRecommendationRisks,
} from "./awardRecommendationFetcherClient";

global.fetch = jest.fn();

describe("getAwardRecommendationRisks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches and returns risks and pagination info", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue({
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
        headers: expect.objectContaining({ "X-SGG-Token": "token" }) as Record<
          string,
          string
        >,
      }) as RequestInit,
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

describe("deleteAwardRecommendationRisk", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deletes risk successfully", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest
        .fn()
        .mockResolvedValue({ message: "Risk deleted successfully" }),
    });
    const result = await deleteAwardRecommendationRisk(
      "award-id",
      "risk-id",
      "token",
    );
    expect(result.success).toBe(true);
    expect(result.message).toBe("Risk deleted successfully");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("award-id/risks/risk-id"),
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({ "X-SGG-Token": "token" }) as Record<
          string,
          string
        >,
      }) as RequestInit,
    );
  });

  it("handles delete failure", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ message: "Delete failed" }),
    });
    const result = await deleteAwardRecommendationRisk(
      "award-id",
      "risk-id",
      "token",
    );
    expect(result.success).toBe(false);
    expect(result.message).toBe("Delete failed");
  });

  it("handles fetch error", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));
    await expect(
      deleteAwardRecommendationRisk("award-id", "risk-id", "token"),
    ).rejects.toThrow("Network error");
  });
});
