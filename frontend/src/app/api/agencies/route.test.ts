/**
 * @jest-environment node
 */

import { searchForAgencies } from "src/app/api/agencies/handler";
import { FilterOption } from "src/types/search/searchFilterTypes";
import { initialFilterOptions } from "src/utils/testing/fixtures";

import { NextRequest } from "next/server";

const mockSearchAndFlattenAgencies = jest.fn();

jest.mock("src/services/fetch/fetchers/agenciesFetcher", () => ({
  searchAndFlattenAgencies: (...args: unknown[]) =>
    mockSearchAndFlattenAgencies(...args) as unknown,
}));

describe("POST request", () => {
  afterEach(() => jest.clearAllMocks());
  it("errors if no keyword in body", async () => {
    const response = await searchForAgencies(
      new NextRequest("http://simpler.grants.gov", {
        method: "POST",
        body: JSON.stringify({ keyword: undefined }),
      }),
    );
    expect(response.status).toBe(500);
    expect(mockSearchAndFlattenAgencies).toHaveBeenCalledTimes(0);
  });
  it("calls searchAndFlattenAgencies as expected", async () => {
    mockSearchAndFlattenAgencies.mockResolvedValue(initialFilterOptions);
    await searchForAgencies(
      new NextRequest("http://simpler.grants.gov", {
        method: "POST",
        body: JSON.stringify({
          keyword: "anything",
          selectedStatuses: ["forecasted", "posted"],
        }),
      }),
    );
    expect(mockSearchAndFlattenAgencies).toHaveBeenCalledWith("anything", [
      "forecasted",
      "posted",
    ]);
  });
  it("responds with return value of searchAndFlattenAgencies", async () => {
    mockSearchAndFlattenAgencies.mockResolvedValue(initialFilterOptions);
    const response = await searchForAgencies(
      new NextRequest("http://simpler.grants.gov", {
        method: "POST",
        body: JSON.stringify({ keyword: "anything" }),
      }),
    );
    const data = (await response.json()) as FilterOption[];
    expect(data).toEqual(initialFilterOptions);
  });
});
