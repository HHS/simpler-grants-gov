import "server-only";

import { ApiRequestError, NetworkError, UnauthorizedError } from "src/errors";
import {
  createRequestUrl,
  sendRequest,
  throwError,
} from "src/services/fetch/fetcherHelpers";
import { QueryParamData } from "src/types/search/searchRequestTypes";
import { wrapForExpectedError } from "src/utils/testing/commonTestUtils";

const searchInputs: QueryParamData = {
  status: new Set(["active"]),
  fundingInstrument: new Set(["grant"]),
  eligibility: new Set(["public"]),
  agency: new Set(["NASA"]),
  category: new Set(["science"]),
  query: "space exploration",
  sortby: "relevancy",
  page: 1,
};

const responseJsonMock = jest
  .fn()
  .mockResolvedValue({ data: [], errors: [], warnings: [] });

const fetchMock = jest.fn().mockResolvedValue({
  json: responseJsonMock,
  ok: true,
  status: 200,
});

describe("createRequestUrl", () => {
  it("creates the correct url without search params", () => {
    const method = "GET";
    let basePath = "";
    let version = "";
    let namespace = "";
    let subpath = "";

    expect(
      createRequestUrl(method, basePath, version, namespace, subpath),
    ).toEqual("");

    basePath = "basePath";
    version = "version";
    namespace = "namespace";
    subpath = "subpath";

    expect(
      createRequestUrl(method, basePath, version, namespace, subpath),
    ).toEqual("basePath/version/namespace/subpath");

    // note that leading slashes are removed but trailing slashes are not
    basePath = "/basePath";
    version = "/version";
    namespace = "/namespace";
    subpath = "/subpath/";

    expect(
      createRequestUrl(method, basePath, version, namespace, subpath),
    ).toEqual("basePath/version/namespace/subpath/");
  });

  it("creates the correct url with search params", () => {
    const method = "GET";
    const body = {
      simpleParam: "simpleValue",
      complexParam: { nestedParam: ["complex", "values", 1] },
    };

    expect(createRequestUrl(method, "", "", "", "", body)).toEqual(
      "?simpleParam=simpleValue&complexParam=%7B%22nestedParam%22%3A%5B%22complex%22%2C%22values%22%2C1%5D%7D",
    );
  });
});

describe("sendRequest", () => {
  let originalFetch: typeof global.fetch;
  beforeAll(() => {
    originalFetch = global.fetch;
  });
  afterAll(() => {
    global.fetch = originalFetch;
  });
  beforeEach(() => {
    global.fetch = fetchMock;
  });
  it("returns expected response body and calls fetch with expected arguments on successful request", async () => {
    const response = await sendRequest("any-url", {
      body: JSON.stringify({ key: "value" }),
      headers: {
        "Content-Type": "application/json",
        "Header-Name": "headerValue",
      },
      method: "POST",
    });
    expect(fetchMock).toHaveBeenCalledWith("any-url", {
      body: JSON.stringify({ key: "value" }),
      headers: {
        "Content-Type": "application/json",
        "Header-Name": "headerValue",
      },
      method: "POST",
    });
    expect(response).toEqual({ data: [], errors: [], warnings: [] });
  });

  it("handles `not ok` errors as expected", async () => {
    const errorMock = jest.fn().mockResolvedValue({
      json: responseJsonMock,
      ok: false,
      status: 200,
    });
    global.fetch = errorMock;

    const sendErrorRequest = async () => {
      await sendRequest(
        "any-url",
        {
          body: JSON.stringify({ key: "value" }),
          headers: {
            "Content-Type": "application/json",
            "Header-Name": "headerValue",
          },
          method: "POST",
        },
        searchInputs,
      );
    };

    await expect(sendErrorRequest()).rejects.toThrow(
      new ApiRequestError("", "APIRequestError", 0, { searchInputs }),
    );
  });

  it("handles network errors as expected", async () => {
    const networkError = new Error("o no an error");
    const errorMock = jest.fn(() => {
      throw networkError;
    });
    global.fetch = errorMock;

    const sendErrorRequest = async () => {
      await sendRequest(
        "any-url",
        {
          body: JSON.stringify({ key: "value" }),
          headers: {
            "Content-Type": "application/json",
            "Header-Name": "headerValue",
          },
          method: "POST",
        },
        searchInputs,
      );
    };

    await expect(sendErrorRequest()).rejects.toThrow(
      new NetworkError(networkError, searchInputs),
    );
  });
});

describe("throwError", () => {
  it("passes along message from response and details from first error, in error type based on status code", async () => {
    const expectedError = await wrapForExpectedError<Error>(() => {
      throwError(
        { data: {}, message: "response message", status_code: 401 },
        "http://any.url",
        undefined,
        {
          field: "fieldName",
          type: "a subtype",
          message: "a detailed message",
        },
      );
    });
    expect(expectedError).toBeInstanceOf(UnauthorizedError);
    expect(expectedError.message).toEqual(
      JSON.stringify({
        type: "UnauthorizedError",
        searchInputs: {},
        message: "response message",
        status: 401,
        details: {
          field: "fieldName",
          type: "a subtype",
          message: "a detailed message",
        },
      }),
    );
  });
});
