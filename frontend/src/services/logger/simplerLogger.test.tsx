/**
 * @jest-environment node
 */

import {
  applyCorrelationId,
  CORRELATION_ID_COOKIE,
  getRequestCorrelationId,
  isValidCorrelationId,
} from "src/services/correlationId/correlationIdMiddleware";
import { logRequest } from "src/services/logger/simplerLogger";

import { NextRequest, NextResponse } from "next/server";

const infoMock = jest.fn();

jest.mock("pino", () => ({
  __esModule: true,
  default: () => ({
    info: (arg: unknown) => infoMock(arg) as unknown,
  }),
}));

// note that logger instantiation is untested at the moment. As the logger matures we should consider adding
// some tests there, but it may be a little messy.
describe("logRequest", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("does not call logger if the request meets criteria for being a prefetch", () => {
    logRequest(
      new NextRequest("http://anywhere.com", {
        headers: new Headers({
          "next-url": "http://somewhere.net",
          "sec-fetch-mode": "cors",
          "sec-fetch-dest": "empty",
        }),
      }),
      new NextResponse(null, {
        status: 200,
      }),
    );
    expect(infoMock).not.toHaveBeenCalled();
  });
  it("calls logger if the request does not meet criteria for being a prefetch", () => {
    logRequest(
      new NextRequest("http://anywhere.com", {
        headers: new Headers({
          "next-url": "",
          "sec-fetch-mode": "bors",
          "sec-fetch-dest": "empties",
          "user-agent": "sure",
          "accept-language": "ES",
          "X-Amz-Cf-Id": "a trace id",
        }),
      }),
      new NextResponse(null, {
        status: 200,
      }),
    );
    expect(infoMock).toHaveBeenCalledTimes(1);
    expect(infoMock).toHaveBeenCalledWith({
      url: "http://anywhere.com/",
      method: "GET",
      userAgent: "sure",
      acceptLanguage: "ES",
      awsTraceId: "a trace id",
      statusCode: 200,
      cacheControl: null,
      hasSessionCookie: false,
      correlation_id: null,
    });
  });
  it("logs correct header values", () => {
    logRequest(
      new NextRequest("http://anywhere.com", {
        headers: new Headers({
          "next-url": "",
          "sec-fetch-mode": "bors",
          "sec-fetch-dest": "empties",
          "user-agent": "sure",
          "accept-language": "ES",
          "X-Amz-Cf-Id": "a trace id",
          Cookies: "session=abc;",
        }),
      }),
      new NextResponse(null, {
        status: 200,
        headers: new Headers({ "cache-control": "no-store" }),
      }),
    );
    expect(infoMock).toHaveBeenCalledTimes(1);
    expect(infoMock).toHaveBeenCalledWith({
      url: "http://anywhere.com/",
      method: "GET",
      userAgent: "sure",
      acceptLanguage: "ES",
      awsTraceId: "a trace id",
      statusCode: 200,
      cacheControl: "no-store",
      hasSessionCookie: false,
      correlation_id: null,
    });
  });

  it("logs the resolved external URL rather than the container URL", () => {
    logRequest(
      new NextRequest("https://0.0.0.0:8000/search?query=test", {
        headers: new Headers({ host: "grantee2.teams.simpler.grants.gov" }),
      }),
      new NextResponse(null, { status: 200 }),
    );

    expect(infoMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://grantee2.teams.simpler.grants.gov/search?query=test",
      }),
    );
  });

  describe("correlation_id", () => {
    const buildRequest = (correlationIdCookie?: string): NextRequest =>
      new NextRequest(
        "http://anywhere.com/search",
        correlationIdCookie === undefined
          ? undefined
          : {
              headers: new Headers({
                cookie: `${CORRELATION_ID_COOKIE}=${correlationIdCookie}`,
              }),
            },
      );

    const logAsProxyDoes = (request: NextRequest): void => {
      const response = applyCorrelationId(request, NextResponse.next());
      logRequest(request, response, getRequestCorrelationId(request, response));
    };

    it("logs the correlation id already carried by the request", () => {
      const existingCorrelationId = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
      logAsProxyDoes(buildRequest(existingCorrelationId));

      expect(infoMock).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "http://anywhere.com/search",
          correlation_id: existingCorrelationId,
        }),
      );
    });

    it("logs the newly generated correlation id when the request has none", () => {
      logAsProxyDoes(buildRequest());

      const sessionStartedLog = infoMock.mock.calls
        .map(([log]: [Record<string, unknown>]) => log)
        .find((log) => log.event === "anonymous_session_started");
      const generatedCorrelationId =
        sessionStartedLog?.correlation_id as string;

      expect(isValidCorrelationId(generatedCorrelationId)).toBe(true);
      expect(infoMock).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "http://anywhere.com/search",
          correlation_id: generatedCorrelationId,
        }),
      );
    });
  });
});
