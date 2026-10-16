/**
 * @jest-environment node
 */

import { getUserSession } from "src/app/api/auth/session/handler";

const getSessionMock = jest.fn();
const refreshSessionMock = jest.fn();
const responseJsonMock = jest.fn((something: unknown) => something);

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => getSessionMock(),
  refreshSession: (token: string): unknown => refreshSessionMock(token),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (any: object) => responseJsonMock(any),
  },
}));

const fullSession = {
  token: "fakeToken",
  email: "user@example.com",
  user_id: "a-user-id",
  session_duration_minutes: 30,
  sub: "a-token-id",
};

// note that all calls to the GET endpoint need to be caught here since the behavior of the Next redirect
// is to throw an error
describe("session GET request", () => {
  afterEach(() => jest.clearAllMocks());
  it("returns only logged in status and expiration when a session exists", async () => {
    const expiresAt = Date.now() + 60 * 60 * 1000;
    getSessionMock.mockImplementation(() => ({ ...fullSession, expiresAt }));

    await getUserSession();

    expect(getSessionMock).toHaveBeenCalledTimes(1);
    expect(refreshSessionMock).not.toHaveBeenCalled();
    expect(responseJsonMock).toHaveBeenCalledTimes(1);
    expect(responseJsonMock).toHaveBeenCalledWith({
      isLoggedIn: true,
      expiresAt,
    });
  });

  it("returns only logged in status and refreshed expiration when the session is expiring", async () => {
    const refreshedExpiresAt = Date.now() + 30 * 60 * 1000;
    getSessionMock.mockImplementation(() => ({
      ...fullSession,
      expiresAt: Date.now() + 60 * 1000,
    }));
    refreshSessionMock.mockImplementation(() => ({
      ...fullSession,
      expiresAt: refreshedExpiresAt,
    }));

    await getUserSession();

    expect(refreshSessionMock).toHaveBeenCalledWith("fakeToken");
    expect(responseJsonMock).toHaveBeenCalledTimes(1);
    expect(responseJsonMock).toHaveBeenCalledWith({
      isLoggedIn: true,
      expiresAt: refreshedExpiresAt,
    });
  });

  it("returns a logged out response if no session exists", async () => {
    getSessionMock.mockImplementation(() => null);
    await getUserSession();

    expect(getSessionMock).toHaveBeenCalledTimes(1);
    expect(responseJsonMock).toHaveBeenCalledTimes(1);
    expect(responseJsonMock).toHaveBeenCalledWith({ isLoggedIn: false });
  });
});
