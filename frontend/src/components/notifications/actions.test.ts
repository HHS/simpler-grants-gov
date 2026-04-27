import { getSession } from "src/services/auth/session";
import { updateSavedOpportunityNotificationPreference } from "src/services/fetch/fetchers/notificationsFetcher";

import { updateSavedOpportunityNotificationPreferenceAction } from "./actions";

jest.mock("next-intl/server", () => ({
  getTranslations: () => (key: string) => key,
}));

jest.mock("src/services/auth/session", () => ({
  getSession: jest.fn(),
}));

jest.mock("src/services/fetch/fetchers/notificationsFetcher", () => ({
  updateSavedOpportunityNotificationPreference: jest.fn(),
}));

describe("updateSavedOpportunityNotificationPreferenceAction", () => {
  const mockedGetSession = jest.mocked(getSession);
  const mockedUpdateSavedOpportunityNotificationPreference = jest.mocked(
    updateSavedOpportunityNotificationPreference,
  );

  const mockUserSession = {
    user_id: "user-123",
    token: "token-123",
    email: "test@example.com",
    session_duration_minutes: 60,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns session expired error when session is missing", async () => {
    mockedGetSession.mockResolvedValue(null);

    const result = await updateSavedOpportunityNotificationPreferenceAction({
      organizationId: null,
      emailEnabled: true,
    });

    expect(result).toEqual({
      success: false,
      error: "expiredSession",
    });

    expect(
      mockedUpdateSavedOpportunityNotificationPreference,
    ).not.toHaveBeenCalled();
  });

  it("returns session expired error when token is missing", async () => {
    mockedGetSession.mockResolvedValue({
      ...mockUserSession,
      token: "",
    });

    const result = await updateSavedOpportunityNotificationPreferenceAction({
      organizationId: null,
      emailEnabled: true,
    });

    expect(result).toEqual({
      success: false,
      error: "expiredSession",
    });

    expect(
      mockedUpdateSavedOpportunityNotificationPreference,
    ).not.toHaveBeenCalled();
  });

  it("calls fetcher with personal preference payload", async () => {
    mockedGetSession.mockResolvedValue(mockUserSession);

    mockedUpdateSavedOpportunityNotificationPreference.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: null,
          message: "Success",
          status_code: 200,
        }),
    } as Response);

    await updateSavedOpportunityNotificationPreferenceAction({
      organizationId: null,
      emailEnabled: true,
    });

    expect(
      mockedUpdateSavedOpportunityNotificationPreference,
    ).toHaveBeenCalledWith("user-123", {
      organization_id: null,
      email_enabled: true,
    });
  });

  it("calls fetcher with organization preference payload", async () => {
    mockedGetSession.mockResolvedValue(mockUserSession);

    mockedUpdateSavedOpportunityNotificationPreference.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: null,
          message: "Success",
          status_code: 200,
        }),
    } as Response);

    await updateSavedOpportunityNotificationPreferenceAction({
      organizationId: "org-456",
      emailEnabled: false,
    });

    expect(
      mockedUpdateSavedOpportunityNotificationPreference,
    ).toHaveBeenCalledWith("user-123", {
      organization_id: "org-456",
      email_enabled: false,
    });
  });

  it("returns success when API response is ok and status_code is 200", async () => {
    mockedGetSession.mockResolvedValue(mockUserSession);

    mockedUpdateSavedOpportunityNotificationPreference.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: null,
          message: "Success",
          status_code: 200,
        }),
    } as Response);

    const result = await updateSavedOpportunityNotificationPreferenceAction({
      organizationId: null,
      emailEnabled: true,
    });

    expect(result).toEqual({
      success: true,
      error: null,
    });
  });

  it("returns error when response.ok is false", async () => {
    mockedGetSession.mockResolvedValue(mockUserSession);

    mockedUpdateSavedOpportunityNotificationPreference.mockResolvedValue({
      ok: false,
      json: () =>
        Promise.resolve({
          data: {},
          message: "Error",
          status_code: 0,
        }),
    } as Response);

    const result = await updateSavedOpportunityNotificationPreferenceAction({
      organizationId: null,
      emailEnabled: true,
    });

    expect(result).toEqual({
      success: false,
      error: "preferencesNotSavedError",
    });
  });

  it("returns error when status_code is not 200", async () => {
    mockedGetSession.mockResolvedValue(mockUserSession);

    mockedUpdateSavedOpportunityNotificationPreference.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {},
          message: "Error",
          status_code: 422,
        }),
    } as Response);

    const result = await updateSavedOpportunityNotificationPreferenceAction({
      organizationId: "org-456",
      emailEnabled: false,
    });

    expect(result).toEqual({
      success: false,
      error: "preferencesNotSavedError",
    });
  });

  it("returns error when fetcher throws", async () => {
    mockedGetSession.mockResolvedValue(mockUserSession);

    mockedUpdateSavedOpportunityNotificationPreference.mockRejectedValue(
      new Error("Network error"),
    );

    const result = await updateSavedOpportunityNotificationPreferenceAction({
      organizationId: null,
      emailEnabled: true,
    });

    expect(result).toEqual({
      success: false,
      error: "preferencesNotSavedError",
    });
  });
});
