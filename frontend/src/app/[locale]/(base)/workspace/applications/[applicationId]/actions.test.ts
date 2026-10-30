import { getSession } from "src/services/auth/session";
import { updateApplicationFilingName } from "src/services/fetch/fetchers/applicationFetcher";

import { updateAppFilingNameAction } from "./actions";

jest.mock("src/services/auth/session", () => ({
  getSession: jest.fn(),
}));

jest.mock("src/services/fetch/fetchers/applicationFetcher", () => ({
  updateApplicationFilingName: jest.fn(),
}));

jest.mock("src/services/logger/simplerLogger", () => ({
  logger: { error: jest.fn() },
}));

jest.mock("next/cache", () => ({
  revalidateTag: jest.fn(),
}));

const mockedGetSession = jest.mocked(getSession);
const mockedUpdate = jest.mocked(updateApplicationFilingName);

const formData = () => {
  const data = new FormData();
  data.append("application_id", "app-1");
  data.append("application_name", "New name");
  return data;
};

describe("updateAppFilingNameAction", () => {
  afterEach(() => jest.clearAllMocks());

  it.each([
    ["no session", null],
    ["no token", { token: "", user_id: "user-1" }],
  ])("returns AUTH_REQUIRED with %s", async (_label, session) => {
    mockedGetSession.mockResolvedValue(
      session as Awaited<ReturnType<typeof getSession>>,
    );

    const result = await updateAppFilingNameAction(undefined, formData());

    expect(result).toEqual({
      success: false,
      error: "Session has expired",
      errorCode: "AUTH_REQUIRED",
    });
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it("does not return AUTH_REQUIRED when the API rejects the update", async () => {
    mockedGetSession.mockResolvedValue({
      token: "token",
      user_id: "user-1",
    } as Awaited<ReturnType<typeof getSession>>);
    mockedUpdate.mockResolvedValue({ status_code: 403 } as Awaited<
      ReturnType<typeof updateApplicationFilingName>
    >);

    const result = await updateAppFilingNameAction(undefined, formData());

    expect(result).toEqual({
      success: false,
      error: "Failed to update application name.",
    });
  });

  it("succeeds without an errorCode when signed in", async () => {
    mockedGetSession.mockResolvedValue({
      token: "token",
      user_id: "user-1",
    } as Awaited<ReturnType<typeof getSession>>);
    mockedUpdate.mockResolvedValue({ status_code: 200 } as Awaited<
      ReturnType<typeof updateApplicationFilingName>
    >);

    const result = await updateAppFilingNameAction(undefined, formData());

    expect(result).toEqual({ success: true, error: null });
  });
});
