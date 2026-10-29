/**
 * @jest-environment node
 */

import { ValidationError } from "src/errors";
import {
  applyCorrelationId,
  CORRELATION_ID_COOKIE,
  getRequestCorrelationId,
  isValidCorrelationId,
} from "src/services/correlationId/correlationIdMiddleware";
import {
  logRequest,
  logResponse,
  serializeError,
} from "src/services/logger/simplerLogger";
import { FrontendErrorDetails } from "src/types/apiResponseTypes";

import { NextRequest, NextResponse } from "next/server";

const infoMock = jest.fn();

jest.mock("pino", () => ({
  __esModule: true,
  default: Object.assign(
    () => ({
      info: (arg: unknown) => infoMock(arg) as unknown,
    }),
    {
      stdSerializers:
        jest.requireActual<typeof import("pino")>("pino").stdSerializers,
    },
  ),
}));

// note that logger instantiation is untested at the moment. As the logger matures we should consider adding
// some tests there, but it may be a little messy.
describe("logRequest", () => {
  afterEach(() => {
    jest.resetAllMocks();
    // the health check sampling tests spy on Math.random, put it back
    jest.restoreAllMocks();
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

  it("does not call logger for health checks outside of the ten percent sample", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.5);
    logRequest(
      new NextRequest("http://anywhere.com/api/health"),
      new NextResponse(null, { status: 200 }),
    );

    expect(infoMock).not.toHaveBeenCalled();
  });

  it("calls logger for health checks inside of the ten percent sample", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.05);
    logRequest(
      new NextRequest("http://anywhere.com/api/health"),
      new NextResponse(null, { status: 200 }),
    );

    expect(infoMock).toHaveBeenCalledTimes(1);
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

describe("logResponse", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("does not call logger for health check responses", () => {
    logResponse(
      new Response(null, {
        status: 200,
        headers: new Headers({
          "simpler-request-for": "http://anywhere.com/api/health",
          "X-Amz-Cf-Id": "a trace id",
        }),
      }),
    );
    expect(infoMock).not.toHaveBeenCalled();
  });
  it("calls logger for other api route responses", () => {
    logResponse(
      new Response(null, {
        status: 200,
        headers: new Headers({
          "simpler-request-for": "http://anywhere.com/api/user",
          "X-Amz-Cf-Id": "a trace id",
        }),
      }),
    );
    expect(infoMock).toHaveBeenCalledTimes(1);
    expect(infoMock).toHaveBeenCalledWith({
      status: 200,
      url: "http://anywhere.com/api/user",
      awsTraceId: "a trace id",
    });
  });
  it("calls logger when the request url header is missing", () => {
    logResponse(
      new Response(null, {
        status: 500,
      }),
    );
    expect(infoMock).toHaveBeenCalledTimes(1);
    expect(infoMock).toHaveBeenCalledWith({
      status: 500,
      url: null,
      awsTraceId: null,
    });
  });
});

describe("serializeError", () => {
  it("preserves error type, message and stack", () => {
    const error = new TypeError("bad thing");
    expect(serializeError(error)).toMatchObject({
      type: "TypeError",
      message: "bad thing",
      stack: error.stack,
    });
  });

  it("includes known fields from our custom error causes", () => {
    const error = new ValidationError("invalid field", {
      field: "applicant.name",
      type: "invalid",
      value: "submitted value",
      searchInputs: { query: "search term" },
    } as unknown as FrontendErrorDetails);
    const serialized = serializeError(error);

    expect(serialized).toMatchObject({
      type: "ValidationError",
      message: expect.stringContaining("invalid field") as string,
      stack: expect.stringContaining("invalid field") as string,
      cause: {
        type: "ValidationError",
        status: 422,
        field: "applicant.name",
        detailType: "invalid",
      },
    });
    expect(JSON.stringify(serialized)).not.toContain("submitted value");
    expect(JSON.stringify(serialized)).not.toContain("search term");
  });

  it("ignores unknown fields on other plain object causes", () => {
    const serialized = serializeError(
      new Error("failed", { cause: { status: 500, body: { secret: "x" } } }),
    );
    expect(serialized).toMatchObject({ cause: { status: 500 } });
    expect(JSON.stringify(serialized)).not.toContain("secret");
  });

  it("leaves Error causes to pino's default handling", () => {
    const serialized = serializeError(
      new Error("outer", { cause: new Error("inner") }),
    );
    expect(serialized.message).toEqual("outer: inner");
    expect(serialized).not.toHaveProperty("cause");
  });

  it.each([null, undefined, "failure", 42])(
    "passes through non-object value %p without throwing",
    (value) => {
      expect(serializeError(value)).toEqual(value);
    },
  );

  it("keeps only known cause fields on plain objects", () => {
    expect(
      serializeError({ cause: { status: 400, details: { value: "secret" } } }),
    ).toEqual({ cause: { status: 400 } });
  });
});
