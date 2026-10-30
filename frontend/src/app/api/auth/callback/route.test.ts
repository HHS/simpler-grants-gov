/**
 * @jest-environment node
 */

import { GET } from "src/app/api/auth/callback/route";
import { wrapForExpectedError } from "src/utils/testing/commonTestUtils";

import { NextRequest } from "next/server";

const createSessionMock = jest.fn();
const mockLoggerError = jest.fn<unknown, unknown[]>();
const mockLoggerInfo = jest.fn<unknown, unknown[]>();

jest.mock("src/services/auth/session", () => ({
  createSession: (token: string): unknown => createSessionMock(token),
}));

jest.mock("src/services/logger/simplerLogger", () => ({
  logger: {
    error: (...args: unknown[]): unknown => mockLoggerError(...args),
    info: (...args: unknown[]): unknown => mockLoggerInfo(...args),
  },
}));

jest.mock("src/services/correlationId/correlationId", () => ({
  getCorrelationId: () => Promise.resolve("a-correlation-id"),
}));

const loggedEvents = () =>
  [...mockLoggerInfo.mock.calls, ...mockLoggerError.mock.calls].map(
    ([fields]) => (fields as { event?: string }).event,
  );

const allLogs = () =>
  JSON.stringify([...mockLoggerInfo.mock.calls, ...mockLoggerError.mock.calls]);

// note that all calls to the GET endpoint need to be caught here since the behavior of the Next redirect
// is to throw an error
describe("/api/auth/callback GET handler", () => {
  afterEach(() => jest.clearAllMocks());
  it("calls createSession on request with token in query params", async () => {
    const redirectError = await wrapForExpectedError<{ digest: string }>(() =>
      GET(new NextRequest("https://simpler.grants.gov/?token=fakeToken")),
    );

    expect(createSessionMock).toHaveBeenCalledTimes(1);
    expect(createSessionMock).toHaveBeenCalledWith("fakeToken");
    expect(redirectError.digest).toContain(";/login;");
  });

  it("if no token exists on query param, does not call createSession and returns through /login", async () => {
    const redirectError = await wrapForExpectedError<{ digest: string }>(() =>
      GET(new NextRequest("https://simpler.grants.gov")),
    );
    expect(createSessionMock).toHaveBeenCalledTimes(0);
    expect(redirectError.digest).toContain(";/login;");
    expect(redirectError.digest).not.toContain("/unauthenticated");
  });

  it("returns through /login with the PIV error flag when PIV is required", async () => {
    const redirectError = await wrapForExpectedError<{ digest: string }>(() =>
      GET(
        new NextRequest(
          "https://simpler.grants.gov/?login_piv_required_error=true",
        ),
      ),
    );
    expect(createSessionMock).toHaveBeenCalledTimes(0);
    expect(redirectError.digest).toContain(";/login?pivError=true;");
  });

  it("logs session creation failures without the token and returns through /login", async () => {
    const sessionError = new Error("session failure");
    createSessionMock.mockRejectedValueOnce(sessionError);

    const redirectError = await wrapForExpectedError<{ digest: string }>(() =>
      GET(
        new NextRequest("https://simpler.grants.gov/?token=fakeToken", {
          headers: { "X-Amz-Cf-Id": "trace-id" },
        }),
      ),
    );

    expect(redirectError.digest).toContain(";/login;");
    expect(redirectError.digest).not.toContain("/error");
    expect(mockLoggerError).toHaveBeenCalledWith(
      {
        event: "session_creation_failed",
        correlation_id: "a-correlation-id",
        err: sessionError,
        awsTraceId: "trace-id",
      },
      "Error creating session",
    );
    expect(loggedEvents()).toEqual([
      "callback_received",
      "session_creation_failed",
    ]);
    expect(allLogs()).not.toContain("fakeToken");
  });

  it("logs callback_received and session_created on success without the token", async () => {
    await wrapForExpectedError(() =>
      GET(
        new NextRequest("https://simpler.grants.gov/?token=fakeToken", {
          headers: { "X-Amz-Cf-Id": "trace-id" },
        }),
      ),
    );

    expect(mockLoggerInfo).toHaveBeenCalledWith(
      {
        event: "callback_received",
        correlation_id: "a-correlation-id",
        awsTraceId: "trace-id",
        tokenPresent: true,
        pivRequiredError: false,
      },
      "Authentication callback received",
    );
    expect(mockLoggerInfo).toHaveBeenCalledWith(
      {
        event: "session_created",
        correlation_id: "a-correlation-id",
        awsTraceId: "trace-id",
      },
      "Session created",
    );
    expect(loggedEvents()).toEqual(["callback_received", "session_created"]);
    expect(mockLoggerError).not.toHaveBeenCalled();
    expect(allLogs()).not.toContain("fakeToken");
  });

  it.each([
    ["no token", "https://simpler.grants.gov", false],
    [
      "a PIV required error",
      "https://simpler.grants.gov/?login_piv_required_error=true",
      true,
    ],
  ])(
    "only logs callback_received when the callback has %s",
    async (_, url, pivRequiredError) => {
      await wrapForExpectedError(() => GET(new NextRequest(url)));

      expect(loggedEvents()).toEqual(["callback_received"]);
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        expect.objectContaining({ tokenPresent: false, pivRequiredError }),
        "Authentication callback received",
      );
      expect(mockLoggerError).not.toHaveBeenCalled();
    },
  );
});
