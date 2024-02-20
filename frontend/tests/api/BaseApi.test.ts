import BaseApi, { ApiMethod } from "../../src/api/BaseApi";

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
    const subPath = "endpoint";

    await testApi.request(method, subPath);

    const expectedHeaders = {
      "Content-Type": "application/json",
    };

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method,
        headers: expectedHeaders,
      })
    );
  });
});
