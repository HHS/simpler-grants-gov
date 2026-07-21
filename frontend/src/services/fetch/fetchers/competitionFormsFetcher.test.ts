import { getCompetitionFormDetails } from "src/services/fetch/fetchers/competitionFormsFetcher";

const fakeResponseBody = { some: "response body" };
const mockJson = jest.fn(() => fakeResponseBody);

const mockFetchCompetitionForm = jest.fn().mockResolvedValue({
  json: mockJson,
});

jest.mock("src/services/fetch/fetchers/fetchers", () => ({
  fetchCompetitionForms: (params: unknown): unknown => {
    return mockFetchCompetitionForm(params);
  },
}));

describe("getFormDetails", () => {
  afterEach(() => jest.clearAllMocks());
  it("calls fetchForm with the correct arguments", async () => {
    await getCompetitionFormDetails("an id");
    expect(mockFetchCompetitionForm).toHaveBeenCalledWith({
      subPath: "an id/forms",
    });
  });

  it("returns json from response", async () => {
    const result = await getCompetitionFormDetails("an id/forms");
    expect(mockJson).toHaveBeenCalledTimes(1);
    expect(result).toEqual(fakeResponseBody);
  });
});
