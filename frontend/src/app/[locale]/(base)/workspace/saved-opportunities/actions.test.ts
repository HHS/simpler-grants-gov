import { getSession } from "src/services/auth/session";
import {
  deleteSavedOpportunityForOrganization,
  saveOpportunityForOrganization,
} from "src/services/fetch/fetchers/organizationSavedOpportunitiesFetcher";

import {
  deleteSavedOpportunityForOrganizationAction,
  saveOpportunityForOrganizationAction,
} from "./actions";

jest.mock("src/services/auth/session", () => ({
  getSession: jest.fn(),
}));

jest.mock(
  "src/services/fetch/fetchers/organizationSavedOpportunitiesFetcher",
  () => ({
    saveOpportunityForOrganization: jest.fn(),
    deleteSavedOpportunityForOrganization: jest.fn(),
  }),
);

jest.mock("src/services/logger/simplerLogger", () => ({
  logger: { error: jest.fn() },
}));

const mockedGetSession = jest.mocked(getSession);
const mockedSave = jest.mocked(saveOpportunityForOrganization);
const mockedDelete = jest.mocked(deleteSavedOpportunityForOrganization);

const props = { organizationId: "org-1", opportunityId: "opp-1" };

const apiResponse = (ok: boolean, status_code: number) =>
  ({
    ok,
    json: () => Promise.resolve({ data: {}, message: "msg", status_code }),
  }) as unknown as Response;

describe.each([
  [
    "saveOpportunityForOrganizationAction",
    saveOpportunityForOrganizationAction,
    mockedSave,
  ],
  [
    "deleteSavedOpportunityForOrganizationAction",
    deleteSavedOpportunityForOrganizationAction,
    mockedDelete,
  ],
])("%s", (_, action, fetcher) => {
  afterEach(() => jest.clearAllMocks());

  it.each([
    ["no session", null],
    ["no token", { token: "", user_id: "user-1" }],
  ])("returns AUTH_REQUIRED with %s", async (_label, session) => {
    mockedGetSession.mockResolvedValue(
      session as Awaited<ReturnType<typeof getSession>>,
    );

    const result = await action(props);

    expect(result).toEqual({
      success: false,
      error: "Session has expired",
      errorCode: "AUTH_REQUIRED",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("does not return AUTH_REQUIRED when the API rejects the request", async () => {
    mockedGetSession.mockResolvedValue({
      token: "token",
      user_id: "user-1",
    } as Awaited<ReturnType<typeof getSession>>);
    fetcher.mockResolvedValue(apiResponse(false, 403));

    const result = await action(props);

    expect(result?.success).toBe(false);
    expect(result?.errorCode).toBeUndefined();
  });

  it("succeeds without an errorCode when signed in", async () => {
    mockedGetSession.mockResolvedValue({
      token: "token",
      user_id: "user-1",
    } as Awaited<ReturnType<typeof getSession>>);
    fetcher.mockResolvedValue(apiResponse(true, 200));

    const result = await action(props);

    expect(result).toEqual({ success: true, error: null });
  });
});
