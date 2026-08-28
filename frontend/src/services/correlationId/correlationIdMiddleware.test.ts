/**
 * @jest-environment node
 */

import {
  applyCorrelationId,
  CORRELATION_ID_COOKIE,
  CORRELATION_ID_MAX_AGE_SECONDS,
  getRequestCorrelationId,
  HEALTH_CHECK_PATHNAME,
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

const buildRequest = ({
  cookieValue,
  url = "http://anywhere.com/",
  referer,
}: {
  cookieValue?: string;
  url?: string;
  referer?: string;
} = {}): NextRequest => {
  const headers = new Headers();
  if (cookieValue !== undefined) {
    headers.set("cookie", `${CORRELATION_ID_COOKIE}=${cookieValue}`);
  }
  if (referer !== undefined) {
    headers.set("referer", referer);
  }
  return new NextRequest(url, { headers });
};

const getCIDCookie = (response: NextResponse): string =>
  response.cookies.get(CORRELATION_ID_COOKIE)?.value ?? "";

describe("isValidCorrelationId", () => {
  it.each([
    ["valid v4", VALID_UUID, true],
    ["v1 uuid (wrong version)", "f47ac10b-58cc-1372-a567-0e02b2c3d479", false],
    ["bad variant nibble", "f47ac10b-58cc-4372-c567-0e02b2c3d479", false],
    ["not a uuid", "not-a-uuid", false],
    ["empty string", "", false],
  ])("%s -> %s", (_label, input, expected) => {
    expect(isValidCorrelationId(input)).toBe(expected);
  });
});

describe("applyCorrelationId", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("generates a CID and logs `anonymous_session_started` when the cookie is absent", () => {
    const request = buildRequest({
      url: "http://anywhere.com/search",
      referer: "http://google.com/",
    });
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
      url: "http://anywhere.com/search",
      referer: "http://google.com/",
    });
  });

  it("logs a null referer when the request has no referer header", () => {
    const request = buildRequest();
    const result = applyCorrelationId(request, NextResponse.next());

    expect(infoMock).toHaveBeenCalledWith({
      event: "anonymous_session_started",
      correlation_id: getCIDCookie(result),
      reason: "missing",
      url: "http://anywhere.com/",
      referer: null,
    });
  });

  it("regenerates the CID and logs `invalid` when the existing cookie is malformed", () => {
    const request = buildRequest({
      cookieValue: "not-a-uuid",
      url: "http://anywhere.com/opportunity/1",
      referer: "http://anywhere.com/search",
    });
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
      url: "http://anywhere.com/opportunity/1",
      referer: "http://anywhere.com/search",
    });
  });

  it("preserves a valid CID and does NOT log a new-session event", () => {
    const request = buildRequest({ cookieValue: VALID_UUID });
    const response = NextResponse.next();
    const result = applyCorrelationId(request, response);
    expect(getCIDCookie(result)).toBe(VALID_UUID);
    expect(infoMock).not.toHaveBeenCalled();
  });

  it("refreshes the cookie on every request to slide the TTL forward", () => {
    const request = buildRequest({ cookieValue: ANOTHER_VALID_UUID });
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
    const request = buildRequest({ cookieValue: VALID_UUID });
    const response = NextResponse.next();
    const result = applyCorrelationId(request, response);
    expect(result.headers.get("set-cookie")?.toLowerCase()).not.toContain(
      "secure",
    );
  });

  it("skips correlation id handling entirely for health checks", () => {
    const request = buildRequest({
      url: `http://anywhere.com${HEALTH_CHECK_PATHNAME}`,
    });
    const result = applyCorrelationId(request, NextResponse.next());

    expect(result.cookies.get(CORRELATION_ID_COOKIE)).toBeUndefined();
    expect(result.headers.get("set-cookie")).toBeNull();
    expect(infoMock).not.toHaveBeenCalled();
  });

  it("does not refresh an existing cookie for health checks", () => {
    const request = buildRequest({
      cookieValue: VALID_UUID,
      url: `http://anywhere.com${HEALTH_CHECK_PATHNAME}`,
    });
    const result = applyCorrelationId(request, NextResponse.next());

    expect(result.headers.get("set-cookie")).toBeNull();
    expect(infoMock).not.toHaveBeenCalled();
  });

  it("still applies correlation id handling to other api routes", () => {
    const request = buildRequest({
      url: "http://anywhere.com/api/auth/login",
    });
    const result = applyCorrelationId(request, NextResponse.next());

    expect(isValidCorrelationId(getCIDCookie(result))).toBe(true);
    expect(infoMock).toHaveBeenCalledTimes(1);
  });
});

describe("getRequestCorrelationId", () => {
  it("returns the id generated onto the response for a first-time visitor", () => {
    const request = buildRequest();
    const response = applyCorrelationId(request, NextResponse.next());

    expect(getRequestCorrelationId(request, response)).toBe(
      getCIDCookie(response),
    );
  });

  it("returns the existing request id when one was already present", () => {
    const request = buildRequest({ cookieValue: VALID_UUID });
    const response = applyCorrelationId(request, NextResponse.next());

    expect(getRequestCorrelationId(request, response)).toBe(VALID_UUID);
  });

  it("returns null when neither request nor response carries an id", () => {
    expect(getRequestCorrelationId(buildRequest(), NextResponse.next())).toBe(
      null,
    );
  });
});
