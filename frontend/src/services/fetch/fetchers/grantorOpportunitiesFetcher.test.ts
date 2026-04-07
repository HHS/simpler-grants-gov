import { fetchGrantorWithMethod } from "src/services/fetch/fetchers/fetchers";
import {
  createOpportunity,
  searchOpportunitiesByAgency,
} from "src/services/fetch/fetchers/grantorOpportunitiesFetcher";
import { PaginationRequestBody } from "src/types/search/searchRequestTypes";
import { fakeAgencyResponseData } from "src/utils/testing/fixtures";

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
type PaginationBody = {
  pagination: PaginationRequestBody;
};
const pageBody: PaginationBody = { pagination: pageRequest };

jest.mock("src/services/fetch/fetchers/fetchers");

describe("searchOpportunitiesByAgency", () => {
  let mockJsonFn: jest.Mock;
  beforeEach(() => {
    jest.clearAllMocks();
    mockJsonFn = jest.fn();
    const mockResponse = { json: mockJsonFn };
    (fetchGrantorWithMethod as jest.Mock).mockReturnValue(
      jest.fn().mockResolvedValue(mockResponse),
    );
  });

  it("calls request function with correct parameters", async () => {
    const token = "test-token";
    const agencyId = "123-ABC-456-DEF";
    const fakeResponse = {
      data: fakeAgencyResponseData,
      status: 200,
    };
    mockJsonFn.mockResolvedValue(fakeResponse);

    const result = await searchOpportunitiesByAgency(
      token,
      agencyId,
      pageRequest,
    );

    expect(result).toEqual(fakeAgencyResponseData);
    expect(fetchGrantorWithMethod).toHaveBeenCalledWith("POST");
    const mockFn = (fetchGrantorWithMethod as jest.Mock).mock.results[0]
      .value as jest.Mock;
    expect(mockFn).toHaveBeenCalledWith({
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
      data: errMsg,
    };
    mockJsonFn.mockResolvedValue(expectedResponse);

    const result = await searchOpportunitiesByAgency(
      token,
      agencyId,
      pageRequest,
    );

    expect(result).toEqual(errMsg);
  });
});

describe("createOpportunity", () => {
  let mockJsonFn: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockJsonFn = jest.fn();
    const mockResponse = { json: mockJsonFn };
    (fetchGrantorWithMethod as jest.Mock).mockReturnValue(
      jest.fn().mockResolvedValue(mockResponse),
    );
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
      data: createOppSchema,
    };
    mockJsonFn.mockResolvedValue(expectedResponse);

    const result = await createOpportunity(token, createOppSchema);

    expect(result).toEqual(createOppSchema);
    expect(fetchGrantorWithMethod).toHaveBeenCalledWith("POST");
    const mockFn = (fetchGrantorWithMethod as jest.Mock).mock.results[0]
      .value as jest.Mock;
    expect(mockFn).toHaveBeenCalledWith({
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
      data: errMsg,
    };
    mockJsonFn.mockResolvedValue(expectedResponse);

    const result = await createOpportunity(token, createOppSchema);

    expect(result).toEqual(errMsg);
  });
});
