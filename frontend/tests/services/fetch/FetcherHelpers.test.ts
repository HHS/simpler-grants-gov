import "server-only";

import { UnauthorizedError } from "src/errors";
import {
  createRequestPath,
  createRequestQueryParams,
  throwError,
} from "src/services/fetch/fetcherHelpers";
import { wrapForExpectedError } from "src/utils/testing/commonTestUtils";

const mockQueryParamsToQueryString = jest
  .fn()
  .mockReturnValue("?a=query&string=test&");

jest.mock("src/utils/generalUtils", () => ({
  ...jest.requireActual<typeof import("src/utils/generalUtils")>(
    "src/utils/generalUtils",
  ),
  queryParamsToQueryString: () => mockQueryParamsToQueryString() as unknown,
}));

describe("createRequestPath", () => {
  it("combines inputs into a path string", () => {
    expect(
      createRequestPath("basePath", "version", "namespace", "subpath"),
    ).toEqual("basePath/version/namespace/subpath");
  });
  it("removes trailing slashes (but not leading slashes)", () => {
    expect(
      createRequestPath("/basePath", "/version", "/namespace", "/subpath/"),
    ).toEqual("basePath/version/namespace/subpath/");
  });
  it("removes any falsey path elements", () => {
    expect(createRequestPath("basePath", "", "namespace", "subpath")).toEqual(
      "basePath/namespace/subpath",
    );
  });
});

describe("createRequestQueryParams", () => {
  it("returns result of queryParamsToQueryString if no body and query params passed", () => {
    expect(
      createRequestQueryParams({
        queryParams: { any: "thing", like: "this" },
      }),
    ).toEqual("?a=query&string=test&");
  });
  it("returns string based on passed body on GET requests", () => {
    expect(
      createRequestQueryParams({
        method: "GET",
        body: { any: "thing", like: "this" },
      }),
    ).toEqual("?any=thing&like=this");
  });
  it("returns empty string if no body and no query params", () => {
    expect(
      createRequestQueryParams({
        method: "GET",
      }),
    ).toEqual("");
  });
  it("returns empty string if no query params and non-GET request", () => {
    expect(
      createRequestQueryParams({
        method: "POST",
        body: { any: "thing", like: "this" },
      }),
    ).toEqual("");
  });
});

describe("throwError", () => {
  it("passes along message from response and details from first error, in error type based on status code", async () => {
    const expectedError = await wrapForExpectedError<Error>(() => {
      throwError(
        {
          data: {},
          message: "response message",
          status_code: 401,
          errors: [
            {
              field: "fieldName",
              type: "a subtype",
              message: "a detailed message",
            },
          ],
        },
        "http://any.url",
      );
    });
    expect(expectedError).toBeInstanceOf(UnauthorizedError);
    expect(expectedError.cause).toEqual({
      details: {
        field: "fieldName",
        message: "a detailed message",
        type: "a subtype",
      },
      message: "response message",
      searchInputs: {},
      status: 401,
      type: "UnauthorizedError",
    });
  });
});
