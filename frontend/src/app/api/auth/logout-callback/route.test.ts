/**
 * @jest-environment node
 */

import { GET } from "src/app/api/auth/logout-callback/route";
import { wrapForExpectedError } from "src/utils/testing/commonTestUtils";

import { NextRequest } from "next/server";

const deleteSessionMock = jest.fn();
const clearCorrelationIdMock = jest.fn();
const mockLoggerInfo = jest.fn();
const mockLoggerError = jest.fn();
const callOrder: string[] = [];
let mockSessionCookie: string | undefined;

jest.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) =>
        name === "session" && mockSessionCookie !== undefined
          ? { name, value: mockSessionCookie }
          : undefined,
    }),
}));

jest.mock("src/services/auth/sessionUtils", () => ({
  deleteSession: (): unknown => deleteSessionMock(),
}));

jest.mock("src/services/correlationId/correlationId", () => ({
  clearCorrelationId: (arg: string) => {
    callOrder.push("clearCorrelationId");
    return clearCorrelationIdMock(arg) as unknown;
  },
  getCorrelationId: () => {
    callOrder.push("getCorrelationId");
    return Promise.resolve("a-correlation-id");
  },
}));

jest.mock("src/services/logger/simplerLogger", () => ({
  logger: {
    info: (...args: unknown[]): unknown => mockLoggerInfo(...args),
    error: (...args: unknown[]): unknown => mockLoggerError(...args),
  },
}));

const logoutCallback = (query = "") =>
  GET(
    new NextRequest(
      `https://simpler.grants.gov/api/auth/logout-callback${query}`,
    ),
  );

// note that all calls to the GET endpoint need to be caught here since the behavior of the Next redirect
// is to throw an error
describe("/api/auth/logout-callback GET handler", () => {
  beforeEach(() => {
    mockSessionCookie = "an-encrypted-session";
  });
  afterEach(() => {
    jest.clearAllMocks();
    callOrder.length = 0;
  });
  it("calls deleteSession", async () => {
    const redirectError = await wrapForExpectedError<{ digest: string }>(() =>
      logoutCallback(),
    );

    expect(deleteSessionMock).toHaveBeenCalledTimes(1);
    expect(redirectError.digest).toContain(";/logout;");
  });

  it("clears correlation id", async () => {
    await wrapForExpectedError<{ digest: string }>(() => logoutCallback());
    expect(clearCorrelationIdMock).toHaveBeenCalledTimes(1);
    expect(clearCorrelationIdMock).toHaveBeenCalledWith(
      "Clearing correlation_id on logout",
    );
  });

  it("logs a logout event with the correlation id read before it is cleared", async () => {
    await wrapForExpectedError(() => logoutCallback("?message=success"));

    expect(mockLoggerInfo).toHaveBeenCalledTimes(1);
    expect(mockLoggerInfo).toHaveBeenCalledWith(
      {
        event: "logout",
        correlation_id: "a-correlation-id",
        awsTraceId: null,
        apiResult: "success",
      },
      "Session deleted on logout",
    );
    expect(callOrder).toEqual(["getCorrelationId", "clearCorrelationId"]);
    expect(mockLoggerError).not.toHaveBeenCalled();
  });

  it.each([
    ["?message=error", "error"],
    ["?message=<script>", undefined],
    ["", undefined],
  ])("only logs a known API logout result for %p", async (query, apiResult) => {
    await wrapForExpectedError(() => logoutCallback(query));

    expect(mockLoggerInfo).toHaveBeenCalledWith(
      expect.objectContaining({ event: "logout", apiResult }),
      "Session deleted on logout",
    );
  });

  it.each([
    ["no session cookie", undefined],
    ["an empty session cookie", ""],
  ])(
    "does not log a logout with %s, but still deletes, clears and redirects",
    async (_, sessionCookie) => {
      mockSessionCookie = sessionCookie;

      const redirectError = await wrapForExpectedError<{ digest: string }>(() =>
        logoutCallback("?message=success"),
      );

      expect(deleteSessionMock).toHaveBeenCalledTimes(1);
      expect(clearCorrelationIdMock).toHaveBeenCalledTimes(1);
      expect(redirectError.digest).toContain(";/logout;");
      expect(mockLoggerInfo).not.toHaveBeenCalled();
      expect(mockLoggerError).not.toHaveBeenCalled();
    },
  );

  it("redirects to the error page and logs an authentication request failure when the session cannot be deleted", async () => {
    const deleteError = new Error("cookie failure");
    deleteSessionMock.mockRejectedValue(deleteError);
    const redirectError = await wrapForExpectedError<{ digest: string }>(() =>
      logoutCallback(),
    );
    expect(clearCorrelationIdMock).toHaveBeenCalledTimes(0);
    expect(redirectError.digest).toContain(";/error;");
    expect(mockLoggerInfo).not.toHaveBeenCalled();
    expect(mockLoggerError).toHaveBeenCalledWith(
      {
        event: "authentication_request_failed",
        correlation_id: "a-correlation-id",
        awsTraceId: null,
        authRequest: "logout_callback",
        err: deleteError,
      },
      "Error deleting session",
    );
  });
});
