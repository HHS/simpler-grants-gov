import "server-only";

import { UnauthorizedError } from "src/errors";
import {
  createRequestUrl,
  removeRedundantSlashes,
  throwError,
} from "src/services/fetch/fetcherHelpers";
import { wrapForExpectedError } from "src/utils/testing/commonTestUtils";

const getSessionMock = jest.fn();

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => getSessionMock(),
}));

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

describe("getDefaultHeaders", () => {
  let mockEnvironment: { [key: string]: string };

  beforeEach(() => {
    jest.resetModules();
    mockEnvironment = {};
    // Mock the environment module here for timing - we need to be able to remock this before each test
    // we'll then import the getDefaultHeaders after doing this mock so that it pulls in the correct
    // mocked values. Need to do this since environments returns constant variables rather than
    // running any mockable functionality, which we'd be able to control more easily
    jest.doMock("src/constants/environments", () => ({
      environment: mockEnvironment,
    }));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("includes Content-Type header by default", async () => {
    // have to import here to make sure that the environment mock runs first
    const { getDefaultHeaders } = await import(
      "src/services/fetch/fetcherHelpers"
    );
    const headers = await getDefaultHeaders({});
    expect(headers["Content-Type"]).toEqual("application/json");
  });

  it("includes X-AUTH header when API_AUTH_TOKEN is set", async () => {
    mockEnvironment.API_AUTH_TOKEN = "test-auth-token";
    mockEnvironment.API_GW_AUTH = "";

    const { getDefaultHeaders } = await import(
      "src/services/fetch/fetcherHelpers"
    );
    const headers = await getDefaultHeaders({});
    expect(headers["X-AUTH"]).toEqual("test-auth-token");
    expect(headers["Content-Type"]).toEqual("application/json");
  });

  it("includes X-API-KEY header when API_GW_AUTH is set", async () => {
    mockEnvironment.API_AUTH_TOKEN = "";
    mockEnvironment.API_GW_AUTH = "test-api-key";

    const { getDefaultHeaders } = await import(
      "src/services/fetch/fetcherHelpers"
    );
    const headers = await getDefaultHeaders({});
    expect(headers["X-API-KEY"]).toEqual("test-api-key");
    expect(headers["Content-Type"]).toEqual("application/json");
  });

  it("includes both X-AUTH and X-API-KEY headers when both tokens are set", async () => {
    mockEnvironment.API_AUTH_TOKEN = "test-auth-token";
    mockEnvironment.API_GW_AUTH = "test-api-key";

    const { getDefaultHeaders } = await import(
      "src/services/fetch/fetcherHelpers"
    );
    const headers = await getDefaultHeaders({});
    expect(headers["X-AUTH"]).toEqual("test-auth-token");
    expect(headers["X-API-KEY"]).toEqual("test-api-key");
    expect(headers["Content-Type"]).toEqual("application/json");
  });

  it("does not include static auth headers when tokens are not set", async () => {
    mockEnvironment.API_AUTH_TOKEN = "";
    mockEnvironment.API_GW_AUTH = "";

    const { getDefaultHeaders } = await import(
      "src/services/fetch/fetcherHelpers"
    );
    const headers = await getDefaultHeaders({});
    expect(headers["X-AUTH"]).toBeUndefined();
    expect(headers["X-API-KEY"]).toBeUndefined();
    expect(headers["Content-Type"]).toEqual("application/json");
  });
  it("does not include user auth token when not required", async () => {
    const { getDefaultHeaders } = await import(
      "src/services/fetch/fetcherHelpers"
    );
    const headers = await getDefaultHeaders({});
    expect(headers["X-SGG-Token"]).toEqual(undefined);
  });
  it("does not include user auth token header if required but not available", async () => {
    getSessionMock.mockResolvedValue(null);
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
    const { getDefaultHeaders } = await import(
      "src/services/fetch/fetcherHelpers"
    );
    const headers = await getDefaultHeaders({ requiresUserAuthToken: true });
    expect(headers["X-SGG-Token"]).toEqual(undefined);
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
  });
  it("includes user auth token from session when present and required", async () => {
    getSessionMock.mockResolvedValue({ token: "a token" });
    const { getDefaultHeaders } = await import(
      "src/services/fetch/fetcherHelpers"
    );
    const headers = await getDefaultHeaders({ requiresUserAuthToken: true });
    expect(headers["X-SGG-Token"]).toEqual("a token");
  });
});

describe("removeRedundantSlashes", () => {
  it("removes leading slashes", () => {
    expect(removeRedundantSlashes("/something/something/something")).toEqual(
      "something/something/something",
    );
  });
  it("retains protocol slashes", () => {
    expect(removeRedundantSlashes("http://anyhost.com/path")).toEqual(
      "http://anyhost.com/path",
    );
  });
  it("removes double path slashes", () => {
    expect(
      removeRedundantSlashes("http://toomany.slashes//path/subpath"),
    ).toEqual("http://toomany.slashes/path/subpath");
  });
});
