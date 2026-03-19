import { handleCreateOpportunity } from "src/services/fetch/fetchers/createOpportunityFetcher";
import { fetchGrantorWithMethod } from "src/services/fetch/fetchers/fetchers";

jest.mock("src/services/fetch/fetchers/fetchers");

describe("handleCreateOpportunity", () => {
  let mockJsonFn: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockJsonFn = jest.fn();
    const mockResponse = { json: mockJsonFn };
    (fetchGrantorWithMethod as jest.Mock).mockReturnValue(
      jest.fn().mockResolvedValue(mockResponse),
    );
  });

  it("should start application with all parameters", async () => {
    const type = "POST";
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

    const result = await handleCreateOpportunity(
      type,
      token,
      createOppSchema,
    );

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
    const type = "POST";
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

    const result = await handleCreateOpportunity(type, token, createOppSchema, );

    expect(result).toEqual(errMsg);
  });

});
