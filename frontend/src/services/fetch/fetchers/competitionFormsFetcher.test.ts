import { updateCompetitionForms } from "src/services/fetch/fetchers/competitionFormsFetcher";

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
    await updateCompetitionForms({
      competitionId: "an id",
      body: { forms: [] },
    });
    expect(mockFetchCompetitionForm).toHaveBeenCalledWith({
      subPath: "an id/forms",
      body: { forms: [] },
    });
  });
});
