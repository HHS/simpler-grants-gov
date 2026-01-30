/**
 * @jest-environment node
 */

import { handleStartApplication } from "src/services/fetch/fetchers/applicationFetcher";
import { fetchApplicationWithMethod } from "src/services/fetch/fetchers/fetchers";
import type {
  ApplicationStartApiResponse,
  StartApplicationFetcherOptions,
} from "src/types/applicationResponseTypes";

jest.mock("src/services/fetch/fetchers/fetchers", () => ({
  fetchApplicationWithMethod: jest.fn(),
}));

describe("handleStartApplication", () => {
  beforeEach(() => {
    (fetchApplicationWithMethod as jest.Mock).mockReset();

    const requesterMock = jest.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({
          status_code: 200,
          message: "ok",
          data: { application_id: "app-1" },
        } as ApplicationStartApiResponse),
    });

    (fetchApplicationWithMethod as jest.Mock).mockReturnValue(requesterMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should start application with all parameters", async () => {
    const options: StartApplicationFetcherOptions = {
      applicationName: "My App",
      competitionId: "comp-123",
      token: "test-token",
      organizationId: "org-456",
      intendsToAddOrganization: false,
    };

    await handleStartApplication(options);

    const requesterMock = (fetchApplicationWithMethod as jest.Mock).mock
      .results[0].value as jest.Mock;

    expect(fetchApplicationWithMethod).toHaveBeenCalledWith("POST");
    expect(requesterMock).toHaveBeenCalledWith({
      subPath: "start",
      additionalHeaders: { "X-SGG-Token": "test-token" },
      body: {
        competition_id: "comp-123",
        application_name: "My App",
        organization_id: "org-456",
        intends_to_add_organization: false,
      },
    });
  });

  it("should start application without organizationId (omits organization_id)", async () => {
    const options: StartApplicationFetcherOptions = {
      applicationName: "My App",
      competitionId: "comp-123",
      token: "test-token",
      intendsToAddOrganization: true,
    };

    await handleStartApplication(options);

    const requesterMock = (fetchApplicationWithMethod as jest.Mock).mock
      .results[0].value as jest.Mock;

    expect(fetchApplicationWithMethod).toHaveBeenCalledWith("POST");
    expect(requesterMock).toHaveBeenCalledWith({
      subPath: "start",
      additionalHeaders: { "X-SGG-Token": "test-token" },
      body: {
        competition_id: "comp-123",
        application_name: "My App",
        intends_to_add_organization: true,
      },
    });
  });

  it("should omit intends_to_add_organization when not provided", async () => {
    const options: StartApplicationFetcherOptions = {
      applicationName: "My App",
      competitionId: "comp-123",
      token: "test-token",
    };

    await handleStartApplication(options);

    const requesterMock = (fetchApplicationWithMethod as jest.Mock).mock
      .results[0].value as jest.Mock;

    expect(fetchApplicationWithMethod).toHaveBeenCalledWith("POST");
    expect(requesterMock).toHaveBeenCalledWith({
      subPath: "start",
      additionalHeaders: { "X-SGG-Token": "test-token" },
      body: {
        competition_id: "comp-123",
        application_name: "My App",
      },
    });
  });

  it("should omit organization_id when organizationId is an empty string", async () => {
    const options: StartApplicationFetcherOptions = {
      applicationName: "My App",
      competitionId: "comp-123",
      token: "test-token",
      organizationId: "",
      intendsToAddOrganization: true,
    };

    await handleStartApplication(options);

    const requesterMock = (fetchApplicationWithMethod as jest.Mock).mock
      .results[0].value as jest.Mock;

    expect(fetchApplicationWithMethod).toHaveBeenCalledWith("POST");
    expect(requesterMock).toHaveBeenCalledWith({
      subPath: "start",
      additionalHeaders: { "X-SGG-Token": "test-token" },
      body: {
        competition_id: "comp-123",
        application_name: "My App",
        intends_to_add_organization: true,
      },
    });
  });
});
