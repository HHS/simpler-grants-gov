import BaseApi, { ApiMethod, JSONRequestBody } from "../../src/api/BaseApi";

// Define a concrete implementation of BaseApi for testing
class TestApi extends BaseApi {
  get basePath(): string {
    return "api";
  }

  get namespace(): string {
    return "test";
  }
}

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

    await testApi.request(method, basePath, namespace, subPath);

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

    await testApi.request(method, basePath, namespace, subPath, body);

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
});
