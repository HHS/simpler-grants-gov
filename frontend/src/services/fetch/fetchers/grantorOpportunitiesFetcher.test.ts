import { ApiRequestError } from "src/errors";
import {
  createCompetitionForGrantor,
  createOpportunity,
  saveCompetitionInstructions,
  searchOpportunitiesByAgency,
  updateCompetitionForGrantor,
} from "src/services/fetch/fetchers/grantorOpportunitiesFetcher";
import { CompetitionSaveRequest } from "src/types/competitionsResponseTypes";
import { PaginationRequestBody } from "src/types/search/searchRequestTypes";
import { fakeAgencyResponseData } from "src/utils/testing/fixtures";

// Mock the grantor agencies/opportunities requesters and the sub-method they call, fetch
const mockFetcher = jest.fn();
const mockFetchGrantorAgenciesWithMethod = jest.fn(
  (_args: unknown) => mockFetcher,
);
const mockFetchGrantorOpportunityWithMethod = jest.fn(
  (_args: unknown) => mockFetcher,
);
jest.mock("src/services/fetch/fetchers/fetchers", () => ({
  fetchGrantorAgenciesWithMethod: (arg: unknown): unknown =>
    mockFetchGrantorAgenciesWithMethod(arg),
  fetchGrantorOpportunityWithMethod: (arg: unknown): unknown =>
    mockFetchGrantorOpportunityWithMethod(arg),
}));

// ---------------------------------------------
// Tests for searchOpportunitiesByAgency
// ---------------------------------------------
const pageRequest: PaginationRequestBody = {
  page_offset: 1,
  page_size: 25,
  sort_order: [
    {
      order_by: "opportunity_title",
      sort_direction: "ascending",
    },
  ],
};
const pageBody: { pagination: PaginationRequestBody } = {
  pagination: pageRequest,
};

describe("searchOpportunitiesByAgency", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("calls request function with correct parameters", async () => {
    const agencyId = "123-ABC-456-DEF";
    const fakeResponse = {
      status: 200,
      json: () =>
        Promise.resolve({
          data: fakeAgencyResponseData,
          pagination_info: { total_pages: 1, total_records: 4 },
        }),
    };
    mockFetcher.mockResolvedValue(fakeResponse);

    const result = await searchOpportunitiesByAgency(agencyId, pageRequest);

    expect(result).toEqual({
      data: fakeAgencyResponseData,
      pagination_info: { total_pages: 1, total_records: 4 },
    });
    expect(mockFetchGrantorAgenciesWithMethod).toHaveBeenCalledTimes(1);
    expect(mockFetchGrantorAgenciesWithMethod).toHaveBeenCalledWith("POST");
    expect(mockFetcher).toHaveBeenCalledWith({
      subPath: "123-ABC-456-DEF/opportunities",
      body: pageBody,
    });
  });

  it("returns first page results with page_size of 2", async () => {
    pageRequest.page_size = 2;
    const firstTwoRows = fakeAgencyResponseData.slice(0, 2);
    const agencyId = "123-ABC-456-DEF";
    const fakeResponse = {
      status: 200,
      json: () =>
        Promise.resolve({
          data: firstTwoRows,
          pagination_info: { total_pages: 2, total_records: 4 },
        }),
    };
    mockFetcher.mockResolvedValue(fakeResponse);

    const result = await searchOpportunitiesByAgency(agencyId, pageRequest);

    expect(result).toEqual({
      data: fakeAgencyResponseData.slice(0, 2),
      pagination_info: { total_pages: 2, total_records: 4 },
    });
    expect(result.data).toHaveLength(2);
    expect(result.pagination_info.total_pages).toBe(2);
    expect(result.pagination_info.total_records).toBe(4);
    expect(result.data[0].agency_code).toEqual("DOCNIST");
    expect(result.data[1].agency_code).toEqual("MOCKNIST");
  });

  it("returns second page results with page_size of 2", async () => {
    pageRequest.page_size = 2;
    pageRequest.page_offset = 2;
    const lastTwoRows = fakeAgencyResponseData.slice(2);
    const agencyId = "123-ABC-456-DEF";
    const fakeResponse = {
      status: 200,
      json: () =>
        Promise.resolve({
          data: lastTwoRows,
          pagination_info: { total_pages: 2, total_records: 4 },
        }),
    };
    mockFetcher.mockResolvedValue(fakeResponse);

    const result = await searchOpportunitiesByAgency(agencyId, pageRequest);

    expect(result).toEqual({
      data: fakeAgencyResponseData.slice(2),
      pagination_info: { total_pages: 2, total_records: 4 },
    });
    expect(result.data).toHaveLength(2);
    expect(result.pagination_info.total_pages).toBe(2);
    expect(result.pagination_info.total_records).toBe(4);
    expect(result.data[0].agency_code).toEqual("MOCKTRASH");
    expect(result.data[1].agency_code).toEqual("FAKEORG");
  });

  it("should return validation error response with 422 status", async () => {
    const agencyId = "123-ABC-456-DEF";
    const errMsg = { errors: { field: "invalid" } };
    const expectedResponse = {
      status_code: 422,
      message: "Validation failed",
      json: () => Promise.resolve({ data: errMsg }),
    };
    mockFetcher.mockResolvedValue(expectedResponse);

    const result = await searchOpportunitiesByAgency(agencyId, pageRequest);

    expect(result).toEqual({
      data: errMsg,
      pagination_info: undefined,
    });
    expect(mockFetchGrantorAgenciesWithMethod).toHaveBeenCalledTimes(1);
    expect(mockFetchGrantorAgenciesWithMethod).toHaveBeenCalledWith("POST");
  });

  it("propagates network errors", async () => {
    mockFetcher.mockRejectedValue(new Error("Network failure"));
    await expect(
      searchOpportunitiesByAgency("any-id", pageRequest),
    ).rejects.toThrow("Network failure");
  });
});

// ---------------------------------------------
// Tests for createOpportunity
// ---------------------------------------------
const createOppSchema = {
  agency_id: "123-ABC-456-DEF",
  opportunity_number: "TEST-OPP-001",
  opportunity_title: "Test Opportunity 001",
  category: "other",
  category_explanation: "Some explanation",
};

describe("createOpportunity", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("calls request function with correct parameters", async () => {
    const expectedResponse = {
      status_code: 200,
      json: () => Promise.resolve({ data: createOppSchema }),
    };
    mockFetcher.mockResolvedValue(expectedResponse);

    const result = await createOpportunity(createOppSchema);

    expect(result).toEqual(createOppSchema);
    expect(mockFetchGrantorOpportunityWithMethod).toHaveBeenCalledTimes(1);
    expect(mockFetchGrantorOpportunityWithMethod).toHaveBeenCalledWith("POST");
    expect(mockFetcher).toHaveBeenCalledWith({
      body: createOppSchema,
    });
  });

  it("should return validation error response with 422 status", async () => {
    const errMsg = { errors: { field: "invalid" } };
    const expectedResponse = {
      status_code: 422,
      message: "Validation failed",
      json: () => Promise.resolve({ data: errMsg }),
    };
    mockFetcher.mockResolvedValue(expectedResponse);

    const result = await createOpportunity(createOppSchema);

    expect(result).toEqual(errMsg);
    expect(mockFetchGrantorOpportunityWithMethod).toHaveBeenCalledTimes(1);
    expect(mockFetchGrantorOpportunityWithMethod).toHaveBeenCalledWith("POST");
  });

  it("propagates network errors", async () => {
    mockFetcher.mockRejectedValue(new Error("Network failure"));
    await expect(createOpportunity(createOppSchema)).rejects.toThrow(
      "Network failure",
    );
  });
});

// ---------------------------------------------
// Tests for opportunity competitions
// ---------------------------------------------
const competitionData: CompetitionSaveRequest = {
  competition_title: "",
  opening_date: null,
  closing_date: null,
  contact_info: null,
  open_to_applicants: ["individual", "organization"],
};

describe("createCompetitionForGrantor", () => {
  beforeEach(() => {
    mockFetcher.mockResolvedValue({
      json: () =>
        Promise.resolve({ data: { competition_id: "new-competition-id" } }),
    });
  });
  afterEach(() => jest.clearAllMocks());

  it("calls fetchGrantorOpportunityWithMethod with POST, the correct subPath, and returns the parsed JSON response", async () => {
    const result = await createCompetitionForGrantor(
      "opp-123",
      competitionData,
    );

    expect(mockFetchGrantorOpportunityWithMethod).toHaveBeenCalledTimes(1);
    expect(mockFetchGrantorOpportunityWithMethod).toHaveBeenCalledWith("POST");
    expect(mockFetcher).toHaveBeenCalledWith({
      subPath: "opp-123/competitions",
      body: competitionData,
    });
    expect(result).toEqual({ data: { competition_id: "new-competition-id" } });
  });

  it("includes public_competition_id in the request body", async () => {
    const competitionWithPublicId: CompetitionSaveRequest = {
      ...competitionData,
      public_competition_id: "PUBLIC-COMP-789",
    };

    await createCompetitionForGrantor("opp-123", competitionWithPublicId);

    expect(mockFetcher).toHaveBeenCalledWith({
      subPath: "opp-123/competitions",
      body: competitionWithPublicId,
    });
  });
});

describe("updateCompetitionForGrantor", () => {
  beforeEach(() => {
    mockFetcher.mockResolvedValue({ json: () => Promise.resolve({}) });
  });
  afterEach(() => jest.clearAllMocks());

  it("calls fetchGrantorOpportunityWithMethod with PUT and the correct subPath", async () => {
    await updateCompetitionForGrantor(
      "opp-123",
      "compete-321",
      competitionData,
    );

    expect(mockFetchGrantorOpportunityWithMethod).toHaveBeenCalledTimes(1);
    expect(mockFetchGrantorOpportunityWithMethod).toHaveBeenCalledWith("PUT");
    expect(mockFetcher).toHaveBeenCalledWith({
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
    mockFetcher.mockRejectedValue(apiError);

    // verify that it throws the error
    await expect(
      updateCompetitionForGrantor("opp-123", "compete-321", competitionData),
    ).rejects.toThrow(ApiRequestError);
  });
});

describe("saveCompetitionInstructions", () => {
  afterEach(() => jest.clearAllMocks());

  it("calls fetchGrantorOpportunityWithMethod with POST, the correct subPath and body, and returns the parsed JSON response", async () => {
    const responseBody = {
      data: {
        competition_instruction_id: "instruction-123",
        file_name: "instructions.pdf",
        created_at: "2026-08-20T00:00:00Z",
      },
    };
    mockFetcher.mockResolvedValue({
      json: () => Promise.resolve(responseBody),
    });

    const result = await saveCompetitionInstructions(
      "opp-123",
      "compete-321",
      "pending-file-456",
    );

    expect(mockFetchGrantorOpportunityWithMethod).toHaveBeenCalledTimes(1);
    expect(mockFetchGrantorOpportunityWithMethod).toHaveBeenCalledWith("POST");
    expect(mockFetcher).toHaveBeenCalledWith({
      subPath: "opp-123/competitions/compete-321/instructions",
      body: { pending_file_id: "pending-file-456" },
    });
    expect(result).toEqual(responseBody);
  });

  it("propagates request errors", async () => {
    mockFetcher.mockRejectedValue(new Error("Network failure"));

    await expect(
      saveCompetitionInstructions("opp-123", "compete-321", "pending-file-456"),
    ).rejects.toThrow("Network failure");
  });
});
