import { EndpointConfig } from "src/services/fetch/endpointConfigs";
import { requesterForEndpoint } from "src/services/fetch/fetchers/fetchers";

const createRequestPathMock = jest.fn(
  (_basePath, _version, _namespace, subPath: string) => {
    if (subPath) {
      return `fakeurl/${subPath}`;
    }
    return "fakeurl";
  },
);
const fakeJsonBody = {
  data: [],
  errors: [],
  warnings: [],
};

const responseJsonMock = jest.fn().mockResolvedValue(fakeJsonBody);

const fakeResponse = {
  json: responseJsonMock,
  ok: true,
};

const fetchMock = jest.fn().mockResolvedValue(fakeResponse);

const createRequestBodyMock = jest.fn((obj) => JSON.stringify(obj));
const createRequestQueryParamsMock = jest.fn().mockReturnValue("?a=queryParam");
const getDefaultHeadersMock = jest.fn(() => ({
  "Content-Type": "application/json",
}));
const throwErrorMock = jest.fn();

jest.mock("src/services/fetch/fetcherHelpers", () => ({
  createRequestPath: (
    _basePath: unknown,
    _version: unknown,
    _namespace: unknown,
    subPath: string,
  ) => createRequestPathMock(_basePath, _version, _namespace, subPath),
  createRequestQueryParams: (...args: unknown[]) =>
    createRequestQueryParamsMock(...args) as unknown,
  createRequestBody: (arg: unknown) => createRequestBodyMock(arg) as unknown,
  getDefaultHeaders: () => getDefaultHeadersMock(),
  throwError: (...args: unknown[]): unknown => throwErrorMock(...args),
}));

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  cache: (fn: unknown) => fn,
}));

describe("requesterForEndpoint", () => {
  const basicEndpoint: EndpointConfig = {
    basePath: "hello.org",
    version: "some-strange-version",
    namespace: "sure",
    method: "POST",
  };

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

  it("returns a function", () => {
    expect(typeof requesterForEndpoint(basicEndpoint)).toBe("function");
  });

  it("returns a function that calls `createRequestPath`, `createRequestQueryParams` and `fetch` with the expected arguments", async () => {
    const requester = requesterForEndpoint(basicEndpoint);
    await requester({
      subPath: "1",
      body: { key: "value" },
      additionalHeaders: { "Header-Name": "headerValue" },
    });
    expect(createRequestPathMock).toHaveBeenCalledWith(
      "hello.org",
      "some-strange-version",
      "sure",
      "1",
    );
    expect(createRequestQueryParamsMock).toHaveBeenCalledWith({
      method: "POST",
      body: { key: "value" },
      queryParams: undefined,
    });
    expect(fetchMock).toHaveBeenCalledWith("fakeurl/1?a=queryParam", {
      body: JSON.stringify({ key: "value" }),
      headers: {
        "Content-Type": "application/json",
        "Header-Name": "headerValue",
      },
      method: "POST",
    });
  });
  it("returns a function that calls `createRequestQueryParams` with passed params", async () => {
    const requester = requesterForEndpoint(basicEndpoint);
    await requester({
      subPath: "1",
      additionalHeaders: { "Header-Name": "headerValue" },
      queryParams: {
        extra: "param",
      },
    });
    expect(createRequestQueryParamsMock).toHaveBeenCalledWith({
      method: "POST",
      queryParams: {
        extra: "param",
      },
      body: undefined,
    });
  });
  it("returns a function that returns a fetch response", async () => {
    const requester = requesterForEndpoint(basicEndpoint);
    const response = await requester({
      subPath: "1",
      body: { key: "value" },
      additionalHeaders: { "Header-Name": "headerValue" },
    });
    expect(response).toEqual(fakeResponse);
  });
  it("extracts errors from json response where applicable", async () => {
    fetchMock.mockResolvedValue({
      json: responseJsonMock,
      ok: false,
      status: 404,
      headers: { get: () => "application/json" },
    });

    const requester = requesterForEndpoint(basicEndpoint);

    await requester({
      subPath: "1",
      body: { key: "value" },
      additionalHeaders: { "Header-Name": "headerValue" },
    });
    expect(responseJsonMock).toHaveBeenCalledTimes(1);
    expect(throwErrorMock).toHaveBeenCalledWith(
      fakeJsonBody,
      "fakeurl/1?a=queryParam",
    );
  });
});
