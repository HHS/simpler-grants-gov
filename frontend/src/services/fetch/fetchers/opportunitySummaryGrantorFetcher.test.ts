import { ApiRequestError } from "src/errors";
import {
  createCompetitionForGrantor,
  updateCompetitionForGrantor,
} from "src/services/fetch/fetchers/opportunitySummaryGrantorFetcher";
import { CompetitionSaveRequest } from "src/types/competitionsResponseTypes";

const mockFetchGrantorOpportunityWithMethod = jest.fn();
const mockJson = jest.fn();

jest.mock("src/services/fetch/fetchers/fetchers", () => ({
  fetchGrantorOpportunityWithMethod:
    (method: string) =>
    (params: unknown): unknown => {
      return mockFetchGrantorOpportunityWithMethod(method, params);
    },
}));

const competitionData: CompetitionSaveRequest = {
  competition_title: "",
  opening_date: null,
  closing_date: null,
  contact_info: null,
  open_to_applicants: ["individual", "organization"],
};
describe("createCompetitionForGrantor", () => {
  beforeEach(() => {
    mockJson.mockResolvedValue({
      data: { competition_id: "new-competition-id" },
    });
    mockFetchGrantorOpportunityWithMethod.mockResolvedValue({ json: mockJson });
  });
  afterEach(() => jest.clearAllMocks());

  it("calls fetchGrantorOpportunityWithMethod with POST and the correct subPath", async () => {
    await createCompetitionForGrantor("opp-123", competitionData);

    expect(mockFetchGrantorOpportunityWithMethod).toHaveBeenCalledWith("POST", {
      subPath: "opp-123/competitions",
      body: competitionData,
    });
  });

  it("returns the parsed JSON response", async () => {
    const result = await createCompetitionForGrantor(
      "opp-123",
      competitionData,
    );

    expect(mockJson).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ data: { competition_id: "new-competition-id" } });
  });
});

describe("updateCompetitionForGrantor", () => {
  beforeEach(() => {
    mockJson.mockResolvedValue({});
    mockFetchGrantorOpportunityWithMethod.mockResolvedValue({ json: mockJson });
  });
  afterEach(() => jest.clearAllMocks());

  it("calls fetchGrantorOpportunityWithMethod with PUT and the correct subPath", async () => {
    await updateCompetitionForGrantor(
      "opp-123",
      "compete-321",
      competitionData,
    );

    expect(mockFetchGrantorOpportunityWithMethod).toHaveBeenCalledWith("PUT", {
      subPath: "opp-123/competitions/compete-321",
      body: competitionData,
    });
  });

  it("throws a 422 error with validation error messages", async () => {
    const mockErrors: Array<{
      field: string;
      message: string;
      type: string;
      value: string | null;
    }> = [
      {
        field: "open_to_applicants",
        message: "Shorter than minimum length 1.",
        type: "min_length",
        value: null,
      },
      {
        field: "competition_title",
        message: "Must not be empty.",
        type: "required",
        value: "",
      },
    ];

    const apiError = new ApiRequestError(
      "Validation error",
      "ValidationError",
      422,
      { errors: mockErrors } as unknown as Record<string, unknown>,
    );
    mockFetchGrantorOpportunityWithMethod.mockRejectedValue(apiError);

    // verify that it throws the error
    await expect(
      updateCompetitionForGrantor("opp-123", "compete-321", competitionData),
    ).rejects.toThrow(ApiRequestError);
  });
});
