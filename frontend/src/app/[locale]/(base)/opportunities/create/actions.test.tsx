import { identity } from "lodash";
import { createOpportunityAction } from "src/app/[locale]/(base)/opportunities/create/[agencyId]/actions";

const getSessionMock = jest.fn();
const mockHandleCreateOpportunity = jest.fn();

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => getSessionMock(),
}));

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
}));

jest.mock("src/services/fetch/fetchers/createOpportunityFetcher", () => ({
  handleCreateOpportunity: (type: "POST", token: unknown, createOppSchema: unknown) =>
    mockHandleCreateOpportunity(type, token, createOppSchema) as unknown,
}));

describe("create opportunity form action", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
  it("returns error if not logged in", async () => {
    getSessionMock.mockResolvedValue({ token: null });
    const createFormData = new FormData();
    const result = await createOpportunityAction(null, createFormData);
    expect(result.errorMessage).toEqual("Not logged in");
  });
  it("returns result of create success", async () => {
    getSessionMock.mockResolvedValue({ type: "POST", token: "logged in", user_id: "1" });
    mockHandleCreateOpportunity.mockImplementation((_type, _token, data) => {
      return data as unknown;
    });

    const createFormData = new FormData();
    createFormData.append("agencyId", "ABC-123-EFG-456");
    createFormData.append("opportunityNumber", "MY-TEST-001");
    createFormData.append("opportunityTitle", "Test Opportunity 001");
    createFormData.append("category", "discretionary");

    const result = await createOpportunityAction(null, createFormData);
    expect(result.data).toEqual({
      agency_id: "ABC-123-EFG-456",
      opportunity_number: "MY-TEST-001",
      opportunity_title: "Test Opportunity 001",
      category: "discretionary",
      category_explanation: null,
    });
  });
  it("returns result of create success with category explanation", async () => {
    getSessionMock.mockResolvedValue({ type: "POST", token: "logged in", user_id: "1" });
    mockHandleCreateOpportunity.mockImplementation((_type, _token, data) => {
      return data as unknown;
    });

    const createFormData = new FormData();
    createFormData.append("agencyId", "ABC-123-EFG-456");
    createFormData.append("opportunityNumber", "MY-TEST-001");
    createFormData.append("opportunityTitle", "Test Opportunity 001");
    createFormData.append("category", "other");
    createFormData.append("categoryExplanation", "Some explanation");

    const result = await createOpportunityAction(null, createFormData);
    expect(result.data).toEqual({
      agency_id: "ABC-123-EFG-456",
      opportunity_number: "MY-TEST-001",
      opportunity_title: "Test Opportunity 001",
      category: "other",
      category_explanation: "Some explanation",
    });
  });
  it("returns API error when applicable", async () => {
    getSessionMock.mockResolvedValue({ type: "POST", token: "logged in", user_id: "1" });
    mockHandleCreateOpportunity.mockRejectedValue(new Error("fake error"));

    const createFormData = new FormData();
    createFormData.append("agencyId", "ABC-123-EFG-456");
    createFormData.append("opportunityNumber", "MY-TEST-001");
    createFormData.append("opportunityTitle", "Test Opportunity 001");
    createFormData.append("category", "discretionary");

    const result = await createOpportunityAction(null, createFormData);
    expect(result.errorMessage).toEqual("fake error");
  });
});
