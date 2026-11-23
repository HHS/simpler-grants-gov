/**
 * @jest-environment node
 */
import { GET } from "src/app/api/auth/login/route";
import { environment } from "src/constants/environments";
import { wrapForExpectedError } from "src/utils/testing/commonTestUtils";

import { NextRequest } from "next/server";

const mockLoggerError = jest.fn();
const mockLoggerInfo = jest.fn();
const mockLoggerWarn = jest.fn();
const hasCookieMock = jest.fn();
const setCookieMock = jest.fn();
const deleteCookieMock = jest.fn();

jest.mock("src/constants/environments", () => ({
  environment: {
    AUTH_LOGIN_URL: "http://simpler.grants.gov/login",
    ENVIRONMENT: "staging",
  },
}));

jest.mock("next/headers", () => ({
  cookies: () => ({
    has: hasCookieMock,
    set: setCookieMock,
    delete: deleteCookieMock,
  }),
}));

jest.mock("src/services/logger/simplerLogger", () => ({
  logger: {
    error: (...args: unknown[]): unknown => mockLoggerError(...args),
    info: (...args: unknown[]): unknown => mockLoggerInfo(...args),
    warn: (...args: unknown[]): unknown => mockLoggerWarn(...args),
  },
}));

const loginWith = (query: string) =>
  wrapForExpectedError<{ digest: string }>(() =>
    GET(new NextRequest(`https://simpler.grants.gov/${query}`)),
  );

jest.mock("src/services/correlationId/correlationId", () => ({
  getCorrelationId: () => Promise.resolve("a-correlation-id"),
}));

describe("/api/auth/login GET handler", () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });
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

  describe("session duration override", () => {
    it("stores a valid override for the callback in a lower environment", async () => {
      const error = await loginWith("?session_duration_seconds=60");

      expect(error.digest).toContain(";http://simpler.grants.gov/login;");
      expect(setCookieMock).toHaveBeenCalledWith(
        "session_duration_override",
        "60",
        {
          httpOnly: true,
          secure: false,
          maxAge: 1800,
          sameSite: "lax",
          path: "/",
        },
      );
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        {
          event: "session_duration_override_requested",
          sessionDurationSeconds: 60,
        },
        "Session duration override requested",
      );
    });

    it("keeps the PIV redirect when an override is requested", async () => {
      const error = await loginWith(
        "?piv_required=true&session_duration_seconds=60",
      );

      expect(error.digest).toContain(
        ";http://simpler.grants.gov/login?piv_required=True;",
      );
      expect(setCookieMock).toHaveBeenCalledTimes(1);
    });

    it.each(["10", "901", "abc"])(
      "ignores an out of range or invalid override of %p",
      async (value) => {
        await loginWith(`?session_duration_seconds=${value}`);

        expect(setCookieMock).not.toHaveBeenCalled();
        expect(mockLoggerWarn).toHaveBeenCalledWith(
          {
            event: "session_duration_override_ignored",
            environment: "staging",
          },
          "Session duration override ignored",
        );
      },
    );

    it("ignores the override in prod", async () => {
      jest.replaceProperty(environment, "ENVIRONMENT", "prod");

      const error = await loginWith("?session_duration_seconds=60");

      expect(error.digest).toContain(";http://simpler.grants.gov/login;");
      expect(setCookieMock).not.toHaveBeenCalled();
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        {
          event: "session_duration_override_ignored",
          environment: "prod",
        },
        "Session duration override ignored",
      );
    });

    it("clears a leftover override when an invalid one is requested", async () => {
      hasCookieMock.mockReturnValue(true);

      await loginWith("?session_duration_seconds=abc");

      expect(deleteCookieMock).toHaveBeenCalledWith(
        "session_duration_override",
      );
      expect(setCookieMock).not.toHaveBeenCalled();
    });

    it("clears a leftover override when none is requested", async () => {
      hasCookieMock.mockReturnValue(true);

      await loginWith("");

      expect(deleteCookieMock).toHaveBeenCalledWith(
        "session_duration_override",
      );
      expect(setCookieMock).not.toHaveBeenCalled();
    });

    it("does not touch cookies on a normal login", async () => {
      hasCookieMock.mockReturnValue(false);

      await loginWith("");

      expect(deleteCookieMock).not.toHaveBeenCalled();
      expect(setCookieMock).not.toHaveBeenCalled();
      expect(mockLoggerWarn).not.toHaveBeenCalled();
    });
  });
});
