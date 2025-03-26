import "server-only";

import { UnauthorizedError } from "src/errors";
import {
  // createRequestUrl,
  createRequestPath,
  createRequestQueryParams,
  throwError,
} from "src/services/fetch/fetcherHelpers";
import { wrapForExpectedError } from "src/utils/testing/commonTestUtils";

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
