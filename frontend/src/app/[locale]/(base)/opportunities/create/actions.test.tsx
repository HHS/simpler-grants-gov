import { identity } from "lodash";
import { createOpportunityAction, validateAgencyAccessAction } from "src/app/[locale]/(base)/opportunities/create/actions";
import { UserPrivilegeResult } from "src/utils/userPrivileges";

const getSessionMock = jest.fn();
const mockCreateOpportunity = jest.fn();
const mockCheckRequiredPrivileges = jest.fn();

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => getSessionMock(),
}));

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
}));

jest.mock("src/services/fetch/fetchers/grantorOpportunitiesFetcher", () => ({
  createOpportunity: (token: unknown, createOppSchema: unknown) =>
    mockCreateOpportunity(token, createOppSchema) as unknown,
}));
jest.mock("src/utils/userPrivileges", () => ({
  checkRequiredPrivileges: (token: string, userId: string, privileges: unknown) => 
    mockCheckRequiredPrivileges(token, userId, privileges) as Promise<UserPrivilegeResult[]>,
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
    getSessionMock.mockResolvedValue({ token: "logged in", user_id: "1" });
    mockCreateOpportunity.mockImplementation((_token, data) => {
      return data as unknown;
    });

    const createFormData = new FormData();
    createFormData.append("agencyId", "ABC-123-EFG-456");
    createFormData.append("opportunityNumber", "MY-TEST-001");
    createFormData.append("opportunityTitle", "Test Opportunity 001");
    createFormData.append("category", "discretionary");
    createFormData.append("assistanceListingNumber", "12-345");

    const result = await createOpportunityAction(null, createFormData);
    expect(result.data).toEqual({
      agency_id: "ABC-123-EFG-456",
      opportunity_number: "MY-TEST-001",
      opportunity_title: "Test Opportunity 001",
      category: "discretionary",
      category_explanation: null,
      assistance_listing_number: "12-345",
    });
  });
  it("returns result of create success with category explanation", async () => {
    getSessionMock.mockResolvedValue({ token: "logged in", user_id: "1" });
    mockCreateOpportunity.mockImplementation((_token, data) => {
      return data as unknown;
    });

    const createFormData = new FormData();
    createFormData.append("agencyId", "ABC-123-EFG-456");
    createFormData.append("opportunityNumber", "MY-TEST-001");
    createFormData.append("opportunityTitle", "Test Opportunity 001");
    createFormData.append("category", "other");
    createFormData.append("categoryExplanation", "Some explanation");
    createFormData.append("assistanceListingNumber", "12-345");

    const result = await createOpportunityAction(null, createFormData);
    expect(result.data).toEqual({
      agency_id: "ABC-123-EFG-456",
      opportunity_number: "MY-TEST-001",
      opportunity_title: "Test Opportunity 001",
      category: "other",
      category_explanation: "Some explanation",
      assistance_listing_number: "12-345",
    });
  });
  it("returns API error when applicable", async () => {
    getSessionMock.mockResolvedValue({ token: "logged in", user_id: "1" });
    mockCreateOpportunity.mockRejectedValue(new Error("fake error"));

    const createFormData = new FormData();
    createFormData.append("agencyId", "ABC-123-EFG-456");
    createFormData.append("opportunityNumber", "MY-TEST-001");
    createFormData.append("opportunityTitle", "Test Opportunity 001");
    createFormData.append("category", "discretionary");

    const result = await createOpportunityAction(null, createFormData);
    expect(result.errorMessage).toEqual("fake error");
  });
});

describe("validateAgencyAccessAction", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });
 
  it("returns error when session is invalid", async () => {
    getSessionMock.mockResolvedValue(null);
    
    const result = await validateAgencyAccessAction("agency-1");
    
    expect(result.error).toEqual("Session error");
  });
 
  it("returns success when user has create_opportunity privilege", async () => {
    getSessionMock.mockResolvedValue({ token: "test-token", user_id: "user-1" });
    mockCheckRequiredPrivileges.mockResolvedValue([
      {
        resourceId: "agency-1",
        resourceType: "agency",
        privilege: "create_opportunity",
        authorized: true
      }
    ]);
    
    const result = await validateAgencyAccessAction("agency-1");
    
    expect(result).toEqual({ success: true });
    expect(mockCheckRequiredPrivileges).toHaveBeenCalledWith(
      "test-token", 
      "user-1", 
      expect.arrayContaining([
        expect.objectContaining({
          resourceId: "agency-1",
          resourceType: "agency",
          privilege: "create_opportunity"
        })
      ])
    );
  });
 
  it("returns error when user doesn't have create_opportunity privilege", async () => {
    getSessionMock.mockResolvedValue({ token: "test-token", user_id: "user-1" });
    mockCheckRequiredPrivileges.mockResolvedValue([
      {
        resourceId: "agency-1",
        resourceType: "agency",
        privilege: "create_opportunity",
        authorized: false
      }
    ]);
    
    const result = await validateAgencyAccessAction("agency-1");
    
    expect(result.error).toEqual("You do not have access to create opportunities for this agency.");
  });
 
  it("returns error when no privileges are returned", async () => {
    getSessionMock.mockResolvedValue({ token: "test-token", user_id: "user-1" });
    mockCheckRequiredPrivileges.mockResolvedValue([]);
    
    const result = await validateAgencyAccessAction("agency-1");
    
    expect(result.error).toEqual("You do not have access to create opportunities for this agency.");
  });
 
  it("returns error when checkRequiredPrivileges throws an error", async () => {
    getSessionMock.mockResolvedValue({ token: "test-token", user_id: "user-1" });
    mockCheckRequiredPrivileges.mockRejectedValue(new Error("API error"));
    
    const result = await validateAgencyAccessAction("agency-1");
    
    expect(result.error).toEqual("You do not have access to create opportunities for this agency.");
  });
});