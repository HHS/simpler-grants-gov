/**
 * @jest-environment node
 */

import { getCompetition } from "src/app/api/competitions/[competitionId]/handler";
import { Competition } from "src/types/competitionsResponseTypes";
import { fakeCompetition } from "src/utils/testing/fixtures";

import { NextRequest } from "next/server";

const mockGetCompetitionDetails = jest.fn();

jest.mock("src/services/fetch/fetchers/competitionsFetcher", () => ({
  getCompetitionDetails: (id: string) =>
    mockGetCompetitionDetails(id) as unknown,
}));

describe("competitions/[competitionId] GET requests", () => {
  afterEach(() => jest.resetAllMocks());
  it("calls opportunityDetails with expected arguments", async () => {
    await getCompetition(new NextRequest("http://hi.gov"), {
      params: Promise.resolve({
        competitionId: "1",
      }),
    });
    expect(mockGetCompetitionDetails).toHaveBeenCalledWith("1");
  });

  it("returns a new response with competition data", async () => {
    mockGetCompetitionDetails.mockResolvedValue(fakeCompetition);
    const response = await getCompetition(new NextRequest("http://hi.gov"), {
      params: Promise.resolve({
        competitionId: "1",
      }),
    });
    expect(response.status).toEqual(200);
    const body = (await response.json()) as Competition;
    expect(body).toEqual(fakeCompetition);
  });

  it("returns a new response with with error if error on data fetch", async () => {
    mockGetCompetitionDetails.mockRejectedValue(new Error());
    const response = await getCompetition(new NextRequest("http://hi.gov"), {
      params: Promise.resolve({
        competitionId: "1",
      }),
    });
    expect(response.status).toEqual(500);
  });
});
