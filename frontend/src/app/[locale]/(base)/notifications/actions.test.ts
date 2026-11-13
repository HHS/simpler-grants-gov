import { getSession } from "src/services/auth/session";
import {
  updateAllOpportunitiesNotificationPreference,
  updateSavedOpportunityNotificationPreference,
} from "src/services/fetch/fetchers/notificationsFetcher";
import { ActionErrorCode } from "src/types/generalTypes";

import {
  updateAllOpportunitiesNotificationPreferenceAction,
  updateSavedOpportunityNotificationPreferenceAction,
} from "./actions";

jest.mock("next-intl/server", () => ({
  getTranslations: () => (key: string) => key,
}));

jest.mock("src/services/auth/session", () => ({
  getSession: jest.fn(),
}));

jest.mock("src/services/fetch/fetchers/notificationsFetcher", () => ({
  updateSavedOpportunityNotificationPreference: jest.fn(),
  updateAllOpportunitiesNotificationPreference: jest.fn(),
}));

const mockApiResponse = ({
  ok = true,
  status_code = 200,
}: { ok?: boolean; status_code?: number } = {}) =>
  ({
    ok,
    json: () =>
      Promise.resolve({
        data: null,
        message: ok && status_code === 200 ? "Success" : "Error",
        status_code,
      }),
  }) as Response;

const mockedGetSession = jest.mocked(getSession);

const mockUserSession = {
  user_id: "user-123",
  token: "token-123",
  email: "test@example.com",
  session_duration_minutes: 60,
};

describe("updateSavedOpportunityNotificationPreferenceAction", () => {
  const mockedUpdateSavedOpportunityNotificationPreference = jest.mocked(
    updateSavedOpportunityNotificationPreference,
  );

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
      errorCode: ActionErrorCode.AUTH_REQUIRED,
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
      errorCode: ActionErrorCode.AUTH_REQUIRED,
    });

    expect(
      mockedUpdateSavedOpportunityNotificationPreference,
    ).not.toHaveBeenCalled();
  });

  it("calls fetcher with personal preference payload", async () => {
    mockedGetSession.mockResolvedValue(mockUserSession);

    mockedUpdateSavedOpportunityNotificationPreference.mockResolvedValue(
      mockApiResponse(),
    );

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

    mockedUpdateSavedOpportunityNotificationPreference.mockResolvedValue(
      mockApiResponse(),
    );

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

    mockedUpdateSavedOpportunityNotificationPreference.mockResolvedValue(
      mockApiResponse(),
    );

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

    mockedUpdateSavedOpportunityNotificationPreference.mockResolvedValue(
      mockApiResponse({ ok: false }),
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

  it("returns error when status_code is not 200", async () => {
    mockedGetSession.mockResolvedValue(mockUserSession);

    mockedUpdateSavedOpportunityNotificationPreference.mockResolvedValue(
      mockApiResponse({ status_code: 422 }),
    );

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

describe("updateAllOpportunitiesNotificationPreferenceAction", () => {
  const mockedUpdateAllOpportunitiesNotificationPreference = jest.mocked(
    updateAllOpportunitiesNotificationPreference,
  );

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns session expired error when session is missing", async () => {
    mockedGetSession.mockResolvedValue(null);

    const result = await updateAllOpportunitiesNotificationPreferenceAction({
      isEnabled: true,
    });

    expect(result).toEqual({
      success: false,
      error: "expiredSession",
    });

    expect(
      mockedUpdateAllOpportunitiesNotificationPreference,
    ).not.toHaveBeenCalled();
  });

  it("returns session expired error when token is missing", async () => {
    mockedGetSession.mockResolvedValue({
      ...mockUserSession,
      token: "",
    });

    const result = await updateAllOpportunitiesNotificationPreferenceAction({
      isEnabled: true,
    });

    expect(result).toEqual({
      success: false,
      error: "expiredSession",
    });

    expect(
      mockedUpdateAllOpportunitiesNotificationPreference,
    ).not.toHaveBeenCalled();
  });

  it.each([true, false])(
    "calls fetcher with is_enabled %s payload",
    async (isEnabled) => {
      mockedGetSession.mockResolvedValue(mockUserSession);
      mockedUpdateAllOpportunitiesNotificationPreference.mockResolvedValue(
        mockApiResponse(),
      );

      await updateAllOpportunitiesNotificationPreferenceAction({ isEnabled });

      expect(
        mockedUpdateAllOpportunitiesNotificationPreference,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockedUpdateAllOpportunitiesNotificationPreference,
      ).toHaveBeenCalledWith("user-123", {
        is_enabled: isEnabled,
      });
    },
  );

  it("returns success when API response is ok and status_code is 200", async () => {
    mockedGetSession.mockResolvedValue(mockUserSession);
    mockedUpdateAllOpportunitiesNotificationPreference.mockResolvedValue(
      mockApiResponse(),
    );

    const result = await updateAllOpportunitiesNotificationPreferenceAction({
      isEnabled: true,
    });

    expect(result).toEqual({
      success: true,
      error: null,
    });
  });

  it("returns error when response.ok is false", async () => {
    mockedGetSession.mockResolvedValue(mockUserSession);
    mockedUpdateAllOpportunitiesNotificationPreference.mockResolvedValue(
      mockApiResponse({ ok: false }),
    );

    const result = await updateAllOpportunitiesNotificationPreferenceAction({
      isEnabled: true,
    });

    expect(result).toEqual({
      success: false,
      error: "preferencesNotSavedError",
    });
  });

  it("returns error when status_code is not 200", async () => {
    mockedGetSession.mockResolvedValue(mockUserSession);
    mockedUpdateAllOpportunitiesNotificationPreference.mockResolvedValue(
      mockApiResponse({ status_code: 422 }),
    );

    const result = await updateAllOpportunitiesNotificationPreferenceAction({
      isEnabled: false,
    });

    expect(result).toEqual({
      success: false,
      error: "preferencesNotSavedError",
    });
  });

  it("returns error when fetcher throws", async () => {
    mockedGetSession.mockResolvedValue(mockUserSession);
    mockedUpdateAllOpportunitiesNotificationPreference.mockRejectedValue(
      new Error("Network error"),
    );

    const result = await updateAllOpportunitiesNotificationPreferenceAction({
      isEnabled: true,
    });

    expect(result).toEqual({
      success: false,
      error: "preferencesNotSavedError",
    });
  });

  it("returns error when response body is not valid JSON", async () => {
    mockedGetSession.mockResolvedValue(mockUserSession);
    mockedUpdateAllOpportunitiesNotificationPreference.mockResolvedValue({
      ok: true,
      json: () => Promise.reject(new SyntaxError("Unexpected token")),
    } as Response);

    const result = await updateAllOpportunitiesNotificationPreferenceAction({
      isEnabled: true,
    });

    expect(result).toEqual({
      success: false,
      error: "preferencesNotSavedError",
    });
  });
});
