import { createCompetitionForGrantor } from "src/services/fetch/fetchers/opportunitySummaryGrantorFetcher";

const mockFetchGrantorOpportunityWithMethod = jest.fn();
const mockJson = jest.fn();

jest.mock("src/services/fetch/fetchers/fetchers", () => ({
  fetchGrantorOpportunityWithMethod:
    (method: string) =>
    (params: unknown): unknown => {
      return mockFetchGrantorOpportunityWithMethod(method, params);
    },
}));

describe("createCompetitionForGrantor", () => {
  beforeEach(() => {
    mockJson.mockResolvedValue({
      data: { competition_id: "new-competition-id" },
    });
    mockFetchGrantorOpportunityWithMethod.mockResolvedValue({ json: mockJson });
  });
  afterEach(() => jest.clearAllMocks());

  it("calls fetchGrantorOpportunityWithMethod with POST and the correct subPath", async () => {
    await createCompetitionForGrantor("opp-123");

    expect(mockFetchGrantorOpportunityWithMethod).toHaveBeenCalledWith("POST", {
      subPath: "opp-123/competitions",
      body: {
        competition_title: "",
        opening_date: null,
        closing_date: null,
        contact_info: null,
        open_to_applicants: ["individual", "organization"],
      },
    });
  });

  it("returns the parsed JSON response", async () => {
    const result = await createCompetitionForGrantor("opp-123");

    expect(mockJson).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ data: { competition_id: "new-competition-id" } });
  });
});
