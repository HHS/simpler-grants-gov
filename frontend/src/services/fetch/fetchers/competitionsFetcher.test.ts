import { getCompetitionDetails } from "src/services/fetch/fetchers/competitionsFetcher";

const mockfetchCompetition = jest.fn();
const mockJson = jest.fn();
const fakeResponseBody = { some: "response body" };

jest.mock("src/services/fetch/fetchers/fetchers", () => ({
  fetchCompetition: (params: unknown): unknown => {
    return mockfetchCompetition(params);
  },
}));

describe("getCompetitionDetails", () => {
  beforeEach(() => {
    mockJson.mockResolvedValue({ data: fakeResponseBody });
    mockfetchCompetition.mockResolvedValue({
      json: mockJson,
    });
  });
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
