/**
 * @jest-environment node
 */

import { POST } from "src/app/api/user/local-quick-login/route";
import { wrapForExpectedError } from "src/utils/testing/commonTestUtils";

import { NextRequest } from "next/server";

const createSessionMock = jest.fn();
const mockLoggerError = jest.fn();

jest.mock("src/services/auth/session", () => ({
  createSession: (token: string): unknown => createSessionMock(token),
}));

jest.mock("src/services/logger/simplerLogger", () => ({
  logger: {
    error: (...args: unknown[]): unknown => mockLoggerError(...args),
  },
}));

const quickLoginRequest = (jwt: string) =>
  new NextRequest("https://simpler.grants.gov/api/user/local-quick-login", {
    method: "POST",
    body: JSON.stringify({ jwt }),
    headers: { "X-Amz-Cf-Id": "trace-id" },
  });

describe("/api/user/local-quick-login POST handler", () => {
  afterEach(() => jest.clearAllMocks());

  it("creates a session and redirects to login", async () => {
    const redirectError = await wrapForExpectedError<{ digest: string }>(() =>
      POST(quickLoginRequest("fakeJwt")),
    );

    expect(createSessionMock).toHaveBeenCalledWith("fakeJwt");
    expect(redirectError.digest).toContain(";/login;");
  });

  it("logs session creation failures without the jwt and redirects to the error page", async () => {
    const sessionError = new Error("session failure");
    createSessionMock.mockRejectedValueOnce(sessionError);

    const redirectError = await wrapForExpectedError<{ digest: string }>(() =>
      POST(quickLoginRequest("fakeJwt")),
    );

    expect(redirectError.digest).toContain(";/error;");
    expect(mockLoggerError).toHaveBeenCalledWith(
      { err: sessionError, awsTraceId: "trace-id" },
      "Error creating local quick login session",
    );
    expect(JSON.stringify(mockLoggerError.mock.calls)).not.toContain("fakeJwt");
  });
});
