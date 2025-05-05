/**
 * @jest-environment node
 */

import { logRequest } from "src/services/logger/simplerLogger";

import { NextRequest } from "next/server";

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
    );
    expect(infoMock).toHaveBeenCalledTimes(1);
    expect(infoMock).toHaveBeenCalledWith({
      url: "http://anywhere.com/",
      method: "GET",
      userAgent: "sure",
      acceptLanguage: "ES",
      awsTraceId: "a trace id",
    });
  });
});
