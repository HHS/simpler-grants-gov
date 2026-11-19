/**
 * @jest-environment node
 */
import { GET } from "src/app/api/auth/login/route";
import { environment } from "src/constants/environments";
import { wrapForExpectedError } from "src/utils/testing/commonTestUtils";

import { NextRequest } from "next/server";

const mockLoggerError = jest.fn();
const mockCookieSet = jest.fn();
const mockCookieDelete = jest.fn();
let mockExistingFallbackCookie: string | undefined;

jest.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: (name: string) =>
        name === "login-redirect-fallback" &&
        mockExistingFallbackCookie !== undefined
          ? { name, value: mockExistingFallbackCookie }
          : undefined,
      set: (...args: unknown[]): unknown => mockCookieSet(...args),
      delete: (...args: unknown[]): unknown => mockCookieDelete(...args),
    }),
}));

jest.mock("src/constants/environments", () => ({
  environment: {
    AUTH_LOGIN_URL: "http://simpler.grants.gov/login",
    ENVIRONMENT: "prod",
  },
}));

jest.mock("src/services/logger/simplerLogger", () => ({
  logger: {
    error: (...args: unknown[]): unknown => mockLoggerError(...args),
  },
}));

jest.mock("src/services/correlationId/correlationId", () => ({
  getCorrelationId: () => Promise.resolve("a-correlation-id"),
}));

const APP_URL = "https://simpler.grants.gov/api/auth/login";

const loginRequest = (
  headers: Record<string, string> = {},
  url: string = APP_URL,
) => new NextRequest(url, { headers });

const expectLoginGovRedirect = async (
  request: NextRequest,
  location = "http://simpler.grants.gov/login",
) => {
  const error = await wrapForExpectedError<{
    digest: string;
    message: string;
  }>(() => GET(request));
  expect(error.message).toEqual("NEXT_REDIRECT");
  expect(error.digest).toContain(`;${location};`);
  expect(error.digest).toContain(";307;");
};

describe("/api/auth/login GET handler", () => {
  beforeEach(() => {
    mockExistingFallbackCookie = undefined;
  });
  afterEach(() => {
    jest.clearAllMocks();
    // undo jest.replaceProperty on AUTH_LOGIN_URL
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

  it("keeps the piv_required redirect unchanged", async () => {
    await expectLoginGovRedirect(
      loginRequest(
        { referer: "https://simpler.grants.gov/workspace" },
        `${APP_URL}?piv_required=true`,
      ),
      "http://simpler.grants.gov/login?piv_required=True",
    );
    expect(mockCookieSet).toHaveBeenCalledTimes(1);
  });

  describe("post-sign-in fallback destination", () => {
    it("stores the pathname and query of a same-origin Referer, preserving utm_source", async () => {
      await expectLoginGovRedirect(
        loginRequest({
          host: "simpler.grants.gov",
          referer:
            "https://simpler.grants.gov/workspace?utm_source=grants.gov&a=b#section",
        }),
      );

      expect(mockCookieSet).toHaveBeenCalledTimes(1);
      expect(mockCookieSet).toHaveBeenCalledWith(
        "login-redirect-fallback",
        "/workspace?utm_source=grants.gov&a=b",
        {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/",
          maxAge: 15 * 60,
        },
      );
      expect(mockCookieDelete).not.toHaveBeenCalled();
      // the destination is never logged
      expect(mockLoggerError).not.toHaveBeenCalled();
    });

    it("accepts a Referer matching the browser-facing Host header when the internal URL differs", async () => {
      await expectLoginGovRedirect(
        loginRequest(
          {
            host: "simpler.grants.gov",
            referer: "https://simpler.grants.gov/search?query=x",
          },
          "http://10.0.0.12:3000/api/auth/login",
        ),
      );

      expect(mockCookieSet).toHaveBeenCalledWith(
        "login-redirect-fallback",
        "/search?query=x",
        expect.anything(),
      );
    });

    it.each([
      ["missing", undefined],
      ["external", "https://evil.example.com/workspace"],
      ["a lookalike host", "https://simpler.grants.gov.evil.example.com/x"],
      ["another port", "https://simpler.grants.gov:8443/workspace"],
      ["malformed", "not a url"],
      ["a non-http scheme", "javascript:alert(1)"],
      ["a blocked auth path", "https://simpler.grants.gov/api/auth/login"],
      ["the login page", "https://simpler.grants.gov/login?pivError=true"],
      ["the logout page", "https://simpler.grants.gov/logout"],
      ["an encoded blocked path", "https://simpler.grants.gov/%61pi/foo"],
    ])(
      "does not create a fallback when the Referer is %s, and still redirects",
      async (_, referer) => {
        await expectLoginGovRedirect(loginRequest(referer ? { referer } : {}));

        expect(mockCookieSet).not.toHaveBeenCalled();
        expect(mockCookieDelete).not.toHaveBeenCalled();
      },
    );

    it("clears a stale fallback from an earlier attempt when the Referer is not usable", async () => {
      mockExistingFallbackCookie = "/workspace?old=attempt";

      await expectLoginGovRedirect(
        loginRequest({ referer: "https://evil.example.com/" }),
      );

      expect(mockCookieSet).not.toHaveBeenCalled();
      expect(mockCookieDelete).toHaveBeenCalledWith({
        name: "login-redirect-fallback",
        path: "/",
      });
    });
  });
});
