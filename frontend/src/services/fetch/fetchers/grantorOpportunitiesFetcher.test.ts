import {
  createOpportunity,
  searchOpportunitiesByAgency,
} from "src/services/fetch/fetchers/grantorOpportunitiesFetcher";
import { PaginationRequestBody } from "src/types/search/searchRequestTypes";
import { fakeAgencyResponseData } from "src/utils/testing/fixtures";

// Mock the main fetchGrantorWithMethod and the sub-method it calls, fetch
const mockFetcher = jest.fn();
const mockFetchGrantorWithMethod = jest.fn((_args: unknown) => mockFetcher);
jest.mock("src/services/fetch/fetchers/fetchers", () => ({
  fetchGrantorWithMethod: (arg: unknown): unknown =>
    mockFetchGrantorWithMethod(arg),
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
    const token = "test-token";
    const agencyId = "123-ABC-456-DEF";
    const fakeResponse = {
      status: 200,
      json: () => Promise.resolve({ data: fakeAgencyResponseData }),
    };
    mockFetcher.mockResolvedValue(fakeResponse);

    const result = await searchOpportunitiesByAgency(
      token,
      agencyId,
      pageRequest,
    );

    expect(result).toEqual(fakeAgencyResponseData);
    expect(mockFetchGrantorWithMethod).toHaveBeenCalledTimes(1);
    expect(mockFetchGrantorWithMethod).toHaveBeenCalledWith("POST");
    expect(mockFetcher).toHaveBeenCalledWith({
      subPath: "agencies/123-ABC-456-DEF/opportunities",
      additionalHeaders: { "X-SGG-Token": token },
      body: pageBody,
    });
  });

  it("should return validation error response with 422 status", async () => {
    const token = "test-token";
    const agencyId = "123-ABC-456-DEF";
    const errMsg = { errors: { field: "invalid" } };
    const expectedResponse = {
      status_code: 422,
      message: "Validation failed",
      json: () => Promise.resolve({ data: errMsg }),
    };
    mockFetcher.mockResolvedValue(expectedResponse);

    const result = await searchOpportunitiesByAgency(
      token,
      agencyId,
      pageRequest,
    );

    expect(result).toEqual(errMsg);
    expect(mockFetchGrantorWithMethod).toHaveBeenCalledTimes(1);
    expect(mockFetchGrantorWithMethod).toHaveBeenCalledWith("POST");
  });
});

// ---------------------------------------------
// Tests for createOpportunity
// ---------------------------------------------
describe("createOpportunity", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("calls request function with correct parameters", async () => {
    const token = "test-token";
    const createOppSchema = {
      agency_id: "123-ABC-456-DEF",
      opportunity_number: "TEST-OPP-001",
      opportunity_title: "Test Opportunity 001",
      category: "other",
      category_explanation: "Some explanation",
    };
    const expectedResponse = {
      status_code: 200,
      json: () => Promise.resolve({ data: createOppSchema }),
    };
    mockFetcher.mockResolvedValue(expectedResponse);

    const result = await createOpportunity(token, createOppSchema);

    expect(result).toEqual(createOppSchema);
    expect(mockFetchGrantorWithMethod).toHaveBeenCalledTimes(1);
    expect(mockFetchGrantorWithMethod).toHaveBeenCalledWith("POST");
    expect(mockFetcher).toHaveBeenCalledWith({
      subPath: "opportunities",
      additionalHeaders: { "X-SGG-Token": token },
      body: createOppSchema,
    });
  });

  it("should return validation error response with 422 status", async () => {
    const token = "test-token";
    const createOppSchema = {
      agency_id: "123-ABC-456-DEF",
      opportunity_number: "TEST-OPP-001",
      opportunity_title: "Test Opportunity 001",
      category: "other",
      category_explanation: "Some explanation",
    };
    const errMsg = { errors: { field: "invalid" } };
    const expectedResponse = {
      status_code: 422,
      message: "Validation failed",
      json: () => Promise.resolve({ data: errMsg }),
    };
    mockFetcher.mockResolvedValue(expectedResponse);

    const result = await createOpportunity(token, createOppSchema);

    expect(result).toEqual(errMsg);
    expect(mockFetchGrantorWithMethod).toHaveBeenCalledTimes(1);
    expect(mockFetchGrantorWithMethod).toHaveBeenCalledWith("POST");
  });
});
