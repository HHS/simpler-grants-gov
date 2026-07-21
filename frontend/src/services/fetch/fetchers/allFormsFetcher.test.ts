import { getForms } from "src/services/fetch/fetchers/allFormsFetcher";

const fakeResponseBody = { some: "response body" };
const mockJson = jest.fn(() => fakeResponseBody);

const mockFetchForms = jest.fn().mockResolvedValue({
  json: mockJson,
});

jest.mock("src/services/fetch/fetchers/fetchers", () => ({
  fetchForm: (params: unknown): unknown => {
    return mockFetchForms(params);
  },
}));

describe("getForms", () => {
  afterEach(() => jest.clearAllMocks());

  it("returns json from response", async () => {
    const result = await getForms();
    expect(mockJson).toHaveBeenCalledTimes(1);
    expect(result).toEqual(fakeResponseBody);
  });
});
