/**
 * @jest-environment node
 */

import {
  applyCorrelationId,
  CORRELATION_ID_COOKIE,
  CORRELATION_ID_MAX_AGE_SECONDS,
  isValidCorrelationId,
} from "src/services/correlationId/correlationIdMiddleware";

import { NextRequest, NextResponse } from "next/server";

const infoMock = jest.fn();

jest.mock("pino", () => ({
  __esModule: true,
  default: () => ({
    info: (arg: unknown) => infoMock(arg) as unknown,
  }),
}));

const VALID_UUID = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
const ANOTHER_VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

const buildRequest = (cookieValue?: string): NextRequest => {
  const headers = new Headers();
  if (cookieValue !== undefined) {
    headers.set("cookie", `${CORRELATION_ID_COOKIE}=${cookieValue}`);
  }
  return new NextRequest("http://anywhere.com/", { headers });
};

const getCIDCookie = (response: NextResponse): string | undefined =>
  response.cookies.get(CORRELATION_ID_COOKIE)?.value;

describe("isValidCorrelationId", () => {
  it.each([
    ["valid v4", VALID_UUID, true],
    ["v1 uuid (wrong version)", "f47ac10b-58cc-1372-a567-0e02b2c3d479", false],
    ["bad variant nibble", "f47ac10b-58cc-4372-c567-0e02b2c3d479", false],
    ["not a uuid", "not-a-uuid", false],
    ["empty string", "", false],
    ["undefined", undefined, false],
  ])("%s -> %s", (_label, input, expected) => {
    expect(isValidCorrelationId(input)).toBe(expected);
  });
});

describe("applyCorrelationId", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("generates a CID and logs `anonymous_session_started` when the cookie is absent", () => {
    const request = buildRequest();
    const response = NextResponse.next();
    const result = applyCorrelationId(request, response);
    const cidCookie = getCIDCookie(result);

    expect(cidCookie).toBeDefined();
    expect(isValidCorrelationId(cidCookie)).toBe(true);
    expect(infoMock).toHaveBeenCalledTimes(1);
    expect(infoMock).toHaveBeenCalledWith({
      event: "anonymous_session_started",
      correlation_id: cidCookie,
      reason: "missing",
    });
  });

  it("regenerates the CID and logs `invalid` when the existing cookie is malformed", () => {
    const request = buildRequest("not-a-uuid");
    const response = NextResponse.next();
    const result = applyCorrelationId(request, response);
    const cidCookie = getCIDCookie(result);

    expect(cidCookie).toBeDefined();
    expect(isValidCorrelationId(cidCookie)).toBe(true);
    expect(cidCookie).not.toBe("not-a-uuid");
    expect(infoMock).toHaveBeenCalledTimes(1);
    expect(infoMock).toHaveBeenCalledWith({
      event: "anonymous_session_started",
      correlation_id: cidCookie,
      reason: "invalid",
    });
  });

  it("preserves a valid CID and does NOT log a new-session event", () => {
    const request = buildRequest(VALID_UUID);
    const response = NextResponse.next();
    const result = applyCorrelationId(request, response);
    expect(getCIDCookie(result)).toBe(VALID_UUID);
    expect(infoMock).not.toHaveBeenCalled();
  });

  it("refreshes the cookie on every request to slide the TTL forward", () => {
    const request = buildRequest(ANOTHER_VALID_UUID);
    const response = NextResponse.next();
    const result = applyCorrelationId(request, response);

    // Test sliding window logic where response.cookies.set was called even though the existing cookie was valid
    const setCookieHeader = result.headers.get("set-cookie") ?? "";
    expect(setCookieHeader).toContain(
      `${CORRELATION_ID_COOKIE}=${ANOTHER_VALID_UUID}`,
    );
    expect(setCookieHeader.toLowerCase()).toContain(
      `max-age=${CORRELATION_ID_MAX_AGE_SECONDS}`,
    );
    expect(setCookieHeader.toLowerCase()).toContain("path=/");
    expect(setCookieHeader.toLowerCase()).toContain("samesite=lax");
    expect(setCookieHeader.toLowerCase()).toContain("httponly");
  });

  it("does not set the Secure attribute outside of prod", () => {
    const request = buildRequest(VALID_UUID);
    const response = NextResponse.next();
    const result = applyCorrelationId(request, response);
    expect(result.headers.get("set-cookie")?.toLowerCase()).not.toContain(
      "secure",
    );
  });
});
