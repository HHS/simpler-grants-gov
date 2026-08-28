/**
 * @jest-environment node
 */

import { logRequest, logResponse } from "src/services/logger/simplerLogger";

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
    });
  });
  it("does not call logger for health checks outside of the ten percent sample", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.5);
    logRequest(
      new NextRequest("http://anywhere.com/api/health"),
      new NextResponse(null, {
        status: 200,
      }),
    );
    expect(infoMock).not.toHaveBeenCalled();
  });
  it("calls logger for health checks inside of the ten percent sample", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.05);
    logRequest(
      new NextRequest("http://anywhere.com/api/health"),
      new NextResponse(null, {
        status: 200,
      }),
    );
    expect(infoMock).toHaveBeenCalledTimes(1);
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
