import { getFormDetails } from "src/services/fetch/fetchers/formsFetcher";

const fakeResponseBody = { some: "response body" };
const mockJson = jest.fn(() => fakeResponseBody);

const mockfetchForm = jest.fn().mockResolvedValue({
  json: mockJson,
});

jest.mock("src/services/fetch/fetchers/fetchers", () => ({
  fetchForm: (params: unknown): unknown => {
    return mockfetchForm(params);
  },
}));

describe("getFormDetails", () => {
  afterEach(() => jest.clearAllMocks());
  it("calls fetchForm with the correct arguments", async () => {
    await getFormDetails("an id");
    expect(mockfetchForm).toHaveBeenCalledWith({ subPath: "an id" });
  });

  it("returns json from response", async () => {
    const result = await getFormDetails("an id");
    expect(mockJson).toHaveBeenCalledTimes(1);
    expect(result).toEqual(fakeResponseBody);
  });
});
