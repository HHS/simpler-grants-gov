import { EndpointConfig } from "src/app/api/EndpointConfigs";
import { requesterForEndpoint } from "src/app/api/Fetchers";

const createRequestUrlMock = jest.fn((..._args) => "fakeurl");
const sendRequestMock = jest.fn((..._args) => Promise.resolve("done"));
const createRequestBodyMock = jest.fn((obj) => JSON.stringify(obj));
const getDefaultHeadersMock = jest.fn(() => ({
  "Content-Type": "application/json",
}));

jest.mock("src/app/api/FetchHelpers", () => ({
  createRequestUrl: (...args: unknown[]) => createRequestUrlMock(...args),
  sendRequest: (...args: unknown[]) => sendRequestMock(...args),
  createRequestBody: (arg: unknown) => createRequestBodyMock(arg),
  getDefaultHeaders: () => getDefaultHeadersMock(),
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

  it("returns a function", () => {
    expect(typeof requesterForEndpoint(basicEndpoint)).toBe("function");
  });

  it("returns a function that calls `createRequestUrl` andf `sendRequest` with the expected arguments", async () => {
    const requester = requesterForEndpoint(basicEndpoint);
    await requester("1", {
      queryParamData: {
        page: 1,
        status: new Set(),
        fundingInstrument: new Set(),
        eligibility: new Set(),
        agency: new Set(),
        category: new Set(),
        sortby: null,
      },
      body: { key: "value" },
      additionalHeaders: { "Header-Name": "headerValue" },
    });
    expect(createRequestUrlMock).toHaveBeenCalledWith(
      "POST",
      "hello.org",
      "some-strange-version",
      "sure",
      "1",
      { key: "value" },
    );
    expect(sendRequestMock).toHaveBeenCalledWith(
      "fakeurl",
      {
        body: JSON.stringify({ key: "value" }),
        headers: {
          "Content-Type": "application/json",
          "Header-Name": "headerValue",
        },
        method: "POST",
      },
      {
        page: 1,
        status: new Set(),
        fundingInstrument: new Set(),
        eligibility: new Set(),
        agency: new Set(),
        category: new Set(),
        sortby: null,
      },
    );
  });
});
