/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

import { getRisksForAwardRecommendation } from "./handler";

const mockGetAwardRecommendationRisks = jest.fn();

jest.mock("src/services/fetch/fetchers/awardRecommendationFetcher", () => ({
  getAwardRecommendationRisks: () =>
    mockGetAwardRecommendationRisks() as unknown,
}));

const mockPagination = { page_offset: 1, page_size: 10, sort_order: [] };
const mockRisks = [{ id: 1, type: "ADD_MONITORING" }];
const mockPaginationInfo = { total_pages: 1, total_records: 1 };

describe("getRisksForAwardRecommendation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns risks and pagination info on success", async () => {
    mockGetAwardRecommendationRisks.mockResolvedValue({
      risks: mockRisks,
      paginationInfo: mockPaginationInfo,
    });
    const req = {
      json: jest.fn().mockResolvedValue({ pagination: mockPagination }),
    } as unknown as NextRequest;
    const params = Promise.resolve({ id: "award-id" });
    const res = await getRisksForAwardRecommendation(req, { params });
    const json = (await res.json()) as {
      data: unknown[];
      pagination_info: unknown;
    };
    expect(json.data).toEqual(mockRisks);
    expect(json.pagination_info).toEqual(mockPaginationInfo);
  });
});
