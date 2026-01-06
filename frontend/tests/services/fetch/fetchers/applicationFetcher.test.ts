import {
  getApplicationDetails,
  handleStartApplication,
  handleSubmitApplication,
} from "src/services/fetch/fetchers/applicationFetcher";
import { fetchApplicationWithMethod } from "src/services/fetch/fetchers/fetchers";

jest.mock("src/services/fetch/fetchers/fetchers");

describe("getApplicationDetails", () => {
  let mockJsonFn: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockJsonFn = jest.fn();
    const mockResponse = { json: mockJsonFn };
    (fetchApplicationWithMethod as jest.Mock).mockReturnValue(
      jest.fn().mockResolvedValue(mockResponse),
    );
  });

  it("should return application details on successful API call", async () => {
    const applicationId = "app-123";
    const token = "test-token";
    const expectedResponse = {
      status_code: 200,
      message: "Success",
      data: { id: "app-123", name: "Test App" },
    };

    mockJsonFn.mockResolvedValue(expectedResponse);

    const result = await getApplicationDetails(applicationId, token);

    expect(result).toEqual(expectedResponse);
    expect(fetchApplicationWithMethod).toHaveBeenCalledWith("GET");
  });
});

describe("handleStartApplication", () => {
  let mockJsonFn: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockJsonFn = jest.fn();
    const mockResponse = { json: mockJsonFn };
    (fetchApplicationWithMethod as jest.Mock).mockReturnValue(
      jest.fn().mockResolvedValue(mockResponse),
    );
  });

  it("should start application with all parameters", async () => {
    const applicationName = "My App";
    const competitionID = "comp-123";
    const token = "test-token";
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
      token,
      organization,
    );

    expect(result).toEqual(expectedResponse);
    expect(fetchApplicationWithMethod).toHaveBeenCalledWith("POST");
    const mockFn = (fetchApplicationWithMethod as jest.Mock).mock.results[0]
      .value as jest.Mock;
    expect(mockFn).toHaveBeenCalledWith({
      subPath: "start",
      additionalHeaders: { "X-SGG-Token": token },
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
    const token = "test-token";
    const expectedResponse = {
      status_code: 200,
      message: "Application started",
      data: { id: "app-123" },
    };

    mockJsonFn.mockResolvedValue(expectedResponse);

    const result = await handleStartApplication(
      applicationName,
      competitionID,
      token,
    );

    expect(result).toEqual(expectedResponse);
    const mockFn = (fetchApplicationWithMethod as jest.Mock).mock.results[0]
      .value as jest.Mock;
    expect(mockFn).toHaveBeenCalledWith({
      subPath: "start",
      additionalHeaders: { "X-SGG-Token": token },
      body: {
        competition_id: competitionID,
        application_name: applicationName,
        organization_id: undefined,
      },
    });
  });
});

describe("handleSubmitApplication", () => {
  let mockJsonFn: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockJsonFn = jest.fn();
    const mockResponse = { json: mockJsonFn };
    (fetchApplicationWithMethod as jest.Mock).mockReturnValue(
      jest.fn().mockResolvedValue(mockResponse),
    );
  });

  it("should submit application successfully", async () => {
    const applicationId = "app-123";
    const token = "test-token";
    const expectedResponse = {
      status_code: 200,
      message: "Application submitted",
      data: {},
    };

    mockJsonFn.mockResolvedValue(expectedResponse);

    const result = await handleSubmitApplication(applicationId, token);

    expect(result).toEqual(expectedResponse);
    expect(fetchApplicationWithMethod).toHaveBeenCalledWith("POST");
    const mockFn = (fetchApplicationWithMethod as jest.Mock).mock.results[0]
      .value as jest.Mock;
    expect(mockFn).toHaveBeenCalledWith({
      subPath: `${applicationId}/submit`,
      additionalHeaders: { "X-SGG-Token": token },
      allowedErrorStatuses: [422],
    });
  });

  it("should return validation error response with 422 status", async () => {
    const applicationId = "app-123";
    const token = "test-token";
    const expectedResponse = {
      status_code: 422,
      message: "Validation failed",
      data: { errors: { field: "invalid" } },
    };

    mockJsonFn.mockResolvedValue(expectedResponse);

    const result = await handleSubmitApplication(applicationId, token);

    expect(result).toEqual(expectedResponse);
    expect(result.status_code).toBe(422);
  });
});
