/**
 * @jest-environment node
 */
import { GET } from "src/app/api/auth/login/route";
import { environment } from "src/constants/environments";
import { wrapForExpectedError } from "src/utils/testing/commonTestUtils";

import { NextRequest } from "next/server";

const mockLoggerError = jest.fn();

jest.mock("src/constants/environments", () => ({
  environment: { AUTH_LOGIN_URL: "http://simpler.grants.gov/login" },
}));

jest.mock("src/services/logger/simplerLogger", () => ({
  logger: {
    error: (...args: unknown[]): unknown => mockLoggerError(...args),
  },
}));

jest.mock("src/services/correlationId/correlationId", () => ({
  getCorrelationId: () => Promise.resolve("a-correlation-id"),
}));

describe("/api/auth/login GET handler", () => {
  afterEach(() => jest.clearAllMocks());
  it("redirects correctly", async () => {
    // next redirects result in an error
    const error = await wrapForExpectedError<{
      digest: string;
      message: string;
    }>(() => GET(new NextRequest("https://simpler.grants.gov/")));

    expect(error.message).toEqual("NEXT_REDIRECT");
    expect(error.digest).toContain(";http://simpler.grants.gov/login;");
    expect(error.digest).toContain(";307;");
    expect(mockLoggerError).not.toHaveBeenCalled();
  });
  it("errors correctly and logs an authentication request failure", async () => {
    jest.replaceProperty(environment, "AUTH_LOGIN_URL", "");

    const response = (await GET(
      new NextRequest("https://simpler.grants.gov/"),
    )) as Response;

    expect(response.headers.get("location")).toBe(null);
    expect(response.status).toBe(500);
    expect(mockLoggerError).toHaveBeenCalledTimes(1);
    expect(mockLoggerError).toHaveBeenCalledWith(
      {
        event: "authentication_request_failed",
        correlation_id: "a-correlation-id",
        awsTraceId: null,
        authRequest: "login",
        reason: "login_url_not_configured",
      },
      "AUTH_LOGIN_URL not defined",
    );
  });
});
