/**
 * @jest-environment node
 */

import { getUserSession } from "src/app/api/auth/session/handler";
import {
  InternalServerError,
  NetworkError,
  UnauthorizedError,
} from "src/errors";

const getSessionMock = jest.fn();
const refreshSessionMock = jest.fn();
const responseJsonMock = jest.fn((something: unknown) => something);
const mockLoggerError = jest.fn();

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => getSessionMock(),
  refreshSession: (token: string): unknown => refreshSessionMock(token),
}));

jest.mock("src/services/logger/simplerLogger", () => ({
  logger: {
    error: (...args: unknown[]): unknown => mockLoggerError(...args),
  },
}));

jest.mock("src/services/correlationId/correlationId", () => ({
  getCorrelationId: () => Promise.resolve("a-correlation-id"),
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

  it.each([
    ["an API server error", new InternalServerError("api down"), 500],
    ["a network error", new NetworkError(new Error("ECONNREFUSED")), 500],
    ["an untyped error", new Error("encrypt failed"), 500],
  ])(
    "logs an authentication request failure when the refresh fails with %s",
    async (_, error, status) => {
      const expiresAt = Date.now() + 60 * 1000;
      getSessionMock.mockImplementation(() => ({ ...fullSession, expiresAt }));
      refreshSessionMock.mockRejectedValue(error);

      await getUserSession();

      expect(responseJsonMock).toHaveBeenCalledWith({
        isLoggedIn: true,
        expiresAt,
      });
      expect(mockLoggerError).toHaveBeenCalledWith(
        {
          err: error,
          event: "authentication_request_failed",
          correlation_id: "a-correlation-id",
          authRequest: "session_refresh",
          status,
        },
        "Unable to refresh expiring token",
      );
      expect(JSON.stringify(mockLoggerError.mock.calls)).not.toContain(
        "fakeToken",
      );
    },
  );

  it("does not label an API token rejection as a request failure", async () => {
    const error = new UnauthorizedError("token expired");
    getSessionMock.mockImplementation(() => ({
      ...fullSession,
      expiresAt: Date.now() + 60 * 1000,
    }));
    refreshSessionMock.mockRejectedValue(error);

    await getUserSession();

    expect(mockLoggerError).toHaveBeenCalledWith(
      { err: error },
      "Unable to refresh expiring token",
    );
  });

  it("returns a logged out response if no session exists", async () => {
    getSessionMock.mockImplementation(() => null);
    await getUserSession();

    expect(getSessionMock).toHaveBeenCalledTimes(1);
    expect(responseJsonMock).toHaveBeenCalledTimes(1);
    expect(responseJsonMock).toHaveBeenCalledWith({ isLoggedIn: false });
  });
});
