import { createOpportunity } from "src/services/fetch/fetchers/createOpportunityFetcher";

const mockJsonFn = jest.fn();
const mockResponse = { json: mockJsonFn };
const mockFetcher = jest.fn().mockResolvedValue(mockResponse);
const mockFetchGrantorWithMethod = jest.fn((_args: unknown) => mockFetcher);
jest.mock("src/services/fetch/fetchers/fetchers", () => ({
  fetchGrantorWithMethod: (...args: unknown[]) =>
    mockFetchGrantorWithMethod(...(args as [unknown])),
}));

describe("createOpportunity", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should start application with all parameters", async () => {
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
      data: errMsg,
    };
    mockJsonFn.mockResolvedValue(expectedResponse);

    const result = await createOpportunity(token, createOppSchema);

    expect(result).toEqual(errMsg);
  });
});
