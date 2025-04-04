
import { getCompetitionDetails } from "src/services/fetch/fetchers/competitionsFetcher";

const fakeResponseBody = { some: "response body" };
const mockJson = jest.fn(() => fakeResponseBody);

const mockfetchCompetition= jest.fn().mockResolvedValue({
  json: mockJson,
});

jest.mock("src/services/fetch/fetchers/fetchers", () => ({
  fetchCompetition: (params: unknown): unknown => {
    return mockfetchCompetition(params);
  },
}));

describe("getCompetitionDetails", () => {
  afterEach(() => jest.clearAllMocks());
  it("calls fetchCompetition with the correct arguments", async () => {
    await getCompetitionDetails("an id");
    expect(mockfetchCompetition).toHaveBeenCalledWith({ subPath: "an id" });
  });

  it("returns json from response", async () => {
    const result = await getCompetitionDetails("an id");
    expect(mockJson).toHaveBeenCalledTimes(1);
    expect(result).toEqual(fakeResponseBody);
  });
});
