import "server-only";

import BaseApi, { ApiMethod, JSONRequestBody } from "../../src/app/api/BaseApi";
import { NetworkError, UnauthorizedError } from "src/errors";

// Define a concrete implementation of BaseApi for testing
class TestApi extends BaseApi {
  get basePath(): string {
    return "api";
  }

  get namespace(): string {
    return "test";
  }
}

const searchInputs = {
  status: new Set(["active"]),
  fundingInstrument: new Set(["grant"]),
  eligibility: new Set(["public"]),
  agency: new Set(["NASA"]),
  category: new Set(["science"]),
  query: "space exploration",
  sortby: "date",
  page: 1,
};

describe("BaseApi", () => {
  let testApi: TestApi;

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ data: [], errors: [], warnings: [] }),
      ok: true,
      status: 200,
    });

    testApi = new TestApi();
  });

  it("sends a GET request to the API", async () => {
    const method: ApiMethod = "GET";
    const basePath = "http://mydomain:8080";
    const namespace = "mynamespace";
    const subPath = "myendpointendpoint";

    await testApi.request(method, basePath, namespace, subPath, searchInputs);

    const expectedHeaders = {
      "Content-Type": "application/json",
    };

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method,
        headers: expectedHeaders,
      }),
    );
  });

  it("sends a POST request to the API", async () => {
    const method: ApiMethod = "POST";
    const basePath = "http://mydomain:8080";
    const namespace = "mynamespace";
    const subPath = "myendpointendpoint";
    const body: JSONRequestBody = {
      pagination: {
        order_by: "opportunity_id",
        page_offset: 1,
        page_size: 25,
        sort_direction: "ascending",
      },
    };

    await testApi.request(
      method,
      basePath,
      namespace,
      subPath,
      searchInputs,
      body,
    );

    const expectedHeaders = {
      "Content-Type": "application/json",
    };

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method,
        headers: expectedHeaders,
        body: JSON.stringify(body),
      }),
    );
  });

  describe("Not OK response", () => {
    let testApi: TestApi;

    beforeEach(() => {
      testApi = new TestApi();
      global.fetch = jest.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({
            data: {},
            errors: [],
            message:
              "The server could not verify that you are authorized to access the URL requested",
            status_code: 401,
          }),
        ok: false,
        status: 401,
      });
    });

    it("throws an UnauthorizedError for a 401 response", async () => {
      const method = "GET";
      const basePath = "http://mydomain:8080";
      const namespace = "mynamespace";
      const subPath = "endpoint";

      await expect(
        testApi.request(method, basePath, namespace, subPath, searchInputs),
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe("API is down", () => {
    let testApi: TestApi;

    beforeEach(() => {
      testApi = new TestApi();
      global.fetch = jest.fn().mockImplementation(() => {
        throw new Error("Network failure");
      });
    });

    it("throws a NetworkError when fetch fails", async () => {
      const method = "GET";
      const basePath = "http://mydomain:8080";
      const namespace = "mynamespace";
      const subPath = "endpoint";

      await expect(
        testApi.request(method, basePath, namespace, subPath, searchInputs),
      ).rejects.toThrow(NetworkError);
    });
  });
});
