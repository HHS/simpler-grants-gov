import getFormData from "src/utils/getFormData";

const mockGetSession = jest.fn();
const mockGetApplicationFormDetails = jest.fn();
const mockProcessFormSchema = jest.fn();
const mockValidateUISchema = jest.fn();

jest.mock("src/services/auth/session", () => ({
  getSession: () => mockGetSession() as unknown,
}));
jest.mock("src/services/fetch/fetchers/applicationFetcher", () => ({
  getApplicationFormDetails: () => mockGetApplicationFormDetails() as unknown,
}));
jest.mock("src/components/applyForm/utils", () => ({
  processFormSchema: () => mockProcessFormSchema() as unknown,
}));
jest.mock("src/components/applyForm/validate", () => ({
  validateUiSchema: () => mockValidateUISchema() as unknown,
}));

describe("getFormData", () => {
  beforeEach(() => {
    mockProcessFormSchema.mockReturnValue({
      formSchema: {},
      conditionalValidationRules: {},
    });
    mockValidateUISchema.mockReturnValue(null);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns UnauthorizedError if no session and no internalToken", async () => {
    mockGetSession.mockResolvedValue(null);
    const result = await getFormData({
      applicationId: "app1",
      appFormId: "form1",
    });
    expect(result).toEqual({ error: "UnauthorizedError" });
  });

  it("returns TopLevelError if API response status is not 200", async () => {
    mockGetSession.mockResolvedValue({ token: "session-token" });
    mockGetApplicationFormDetails.mockResolvedValue({
      status_code: 500,
      data: {},
    });
    const result = await getFormData({
      applicationId: "app1",
      appFormId: "form1",
    });
    expect(result).toEqual({ error: "TopLevelError" });
  });

  it("returns TopLevelError if no form data", async () => {
    mockGetSession.mockResolvedValue({ token: "session-token" });
    mockGetApplicationFormDetails.mockResolvedValue({
      status_code: 200,
      data: {},
    });
    const result = await getFormData({
      applicationId: "app1",
      appFormId: "form1",
    });
    expect(result).toEqual({ error: "TopLevelError" });
  });

  it("returns TopLevelError if application_form_id does not match", async () => {
    mockGetSession.mockResolvedValue({ token: "session-token" });
    mockGetApplicationFormDetails.mockResolvedValue({
      status_code: 200,
      data: {
        form: {
          form_id: "form1",
          form_name: "Test",
          form_json_schema: {},
          form_ui_schema: {},
        },
        application_form_id: "wrong-id",
      },
    });
    const result = await getFormData({
      applicationId: "app1",
      appFormId: "form1",
    });
    expect(result).toEqual({ error: "TopLevelError" });
  });

  it("returns data on success", async () => {
    mockGetSession.mockResolvedValue({ token: "session-token" });
    mockProcessFormSchema.mockReturnValue({
      formSchema: {},
      conditionalValidationRules: {},
    });
    mockGetApplicationFormDetails.mockResolvedValue({
      status_code: 200,
      data: {
        form: {
          form_id: "form1",
          form_name: "Test",
          form_json_schema: {},
          form_ui_schema: {},
        },
        application_form_id: "form1",
        application_response: { foo: "bar" },
        application_name: "cool application",
        application_attachments: ["fake attachment"],
      },
      warnings: [],
    });
    const result = await getFormData({
      applicationId: "app1",
      appFormId: "form1",
    });
    expect(result).toEqual({
      data: {
        applicationResponse: { foo: "bar" },
        applicationName: "cool application",
        applicationAttachments: ["fake attachment"],
        formId: "form1",
        formName: "Test",
        formSchema: {},
        formUiSchema: {},
        formValidationWarnings: [],
      },
    });
  });
});
