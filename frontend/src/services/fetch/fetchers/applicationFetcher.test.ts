import {
  getApplicationDetails,
  handleStartApplication,
  handleSubmitApplication,
} from "src/services/fetch/fetchers/applicationFetcher";

const mockJsonFn = jest.fn();
const mockResponse = { json: mockJsonFn };
const mockFetcher = jest.fn().mockResolvedValue(mockResponse);
const mockFetchApplicationWithMethod = jest.fn((_args: unknown) => mockFetcher);
jest.mock("src/services/fetch/fetchers/fetchers", () => ({
  fetchApplicationWithMethod: (...args: unknown[]) =>
    mockFetchApplicationWithMethod(...(args as [unknown])),
}));

describe("getApplicationDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return application details on successful API call", async () => {
    const applicationId = "app-123";
    const expectedResponse = {
      status_code: 200,
      message: "Success",
      data: { id: "app-123", name: "Test App" },
    };

    mockJsonFn.mockResolvedValue(expectedResponse);

    const result = await getApplicationDetails(applicationId);

    expect(result).toEqual(expectedResponse);
    expect(mockFetchApplicationWithMethod).toHaveBeenCalledWith("GET");
  });
});

describe("handleStartApplication", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should start application with all parameters", async () => {
    const applicationName = "My App";
    const competitionID = "comp-123";
    const organization = "org-456";
    const expectedResponse = {
      status_code: 200,
      message: "Application started",
      data: { id: "app-123" },
    };

    mockJsonFn.mockResolvedValue(expectedResponse);

    const result = await handleStartApplication(
      applicationName,
      competitionID,
      organization,
    );

    expect(result).toEqual(expectedResponse);
    expect(mockFetchApplicationWithMethod).toHaveBeenCalledWith("POST");
    expect(mockFetcher).toHaveBeenCalledWith({
      subPath: "start",
      body: {
        competition_id: competitionID,
        application_name: applicationName,
        organization_id: organization,
      },
    });
  });

  it("should start application without organization parameter", async () => {
    const applicationName = "My App";
    const competitionID = "comp-123";
    const expectedResponse = {
      status_code: 200,
      message: "Application started",
      data: { id: "app-123" },
    };

    mockJsonFn.mockResolvedValue(expectedResponse);

    const result = await handleStartApplication(applicationName, competitionID);

    expect(result).toEqual(expectedResponse);
    expect(mockFetcher).toHaveBeenCalledWith({
      subPath: "start",
      body: {
        competition_id: competitionID,
        application_name: applicationName,
        organization_id: undefined,
      },
    });
  });
});

describe("handleSubmitApplication", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should submit application successfully", async () => {
    const applicationId = "app-123";
    const expectedResponse = {
      status_code: 200,
      message: "Application submitted",
      data: {},
    };

    mockJsonFn.mockResolvedValue(expectedResponse);

    const result = await handleSubmitApplication(applicationId);

    expect(result).toEqual(expectedResponse);
    expect(mockFetchApplicationWithMethod).toHaveBeenCalledWith("POST");
    expect(mockFetcher).toHaveBeenCalledWith({
      subPath: `${applicationId}/submit`,
      allowedErrorStatuses: [422],
    });
  });

  it("should return validation error response with 422 status", async () => {
    const applicationId = "app-123";
    const expectedResponse = {
      status_code: 422,
      message: "Validation failed",
      data: { errors: { field: "invalid" } },
    };

    mockJsonFn.mockResolvedValue(expectedResponse);

    const result = await handleSubmitApplication(applicationId);

    expect(result).toEqual(expectedResponse);
    expect(result.status_code).toBe(422);
  });
});
