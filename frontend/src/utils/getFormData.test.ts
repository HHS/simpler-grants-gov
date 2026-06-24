
import getFormData from "src/utils/getFormData";

const mockGetSession = jest.fn();
const mockGetApplicationFormDetails = jest.fn();
const mockProcessFormSchema = jest.fn();
const mockValidateUISchema = jest.fn();
const mockGetApplicationFormDetailsForPrint = jest.fn();

jest.mock("src/services/auth/session", () => ({
  getSession: () => mockGetSession() as unknown,
}));

jest.mock("src/services/fetch/fetchers/applicationFetcher", () => ({
  getApplicationFormDetails: (...args: unknown[]) =>
    mockGetApplicationFormDetails(...args) as unknown,
  getApplicationFormDetailsForPrint: (...args: unknown[]) =>
    mockGetApplicationFormDetailsForPrint(...args) as unknown,
}));

jest.mock("src/utils/applyForm/applyFormUtils", () => ({
  processFormSchema: () => mockProcessFormSchema() as unknown,
}));

jest.mock("src/utils/applyForm/validateUiSchema", () => ({
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

  it("returns TopLevelError if ui schema validation fails", async () => {
    mockGetSession.mockResolvedValue({ token: "session-token" });
    mockValidateUISchema.mockReturnValue(["invalid ui schema"]);
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
      },
      warnings: [],
    });

    const result = await getFormData({
      applicationId: "app1",
      appFormId: "form1",
    });

    expect(result).toEqual({ error: "TopLevelError" });
  });

  it("returns NotFound when API throws a 404 error", async () => {
    mockGetSession.mockResolvedValue({ token: "session-token" });
    mockGetApplicationFormDetails.mockRejectedValue({ status: 404 });

    const result = await getFormData({
      applicationId: "app1",
      appFormId: "form1",
    });

    expect(result).toEqual({ error: "NotFound" });
  });

  it("returns TopLevelError when processFormSchema throws", async () => {
    mockGetSession.mockResolvedValue({ token: "session-token" });
    mockProcessFormSchema.mockImplementation(() => {
      throw new Error("invalid schema");
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
      },
      warnings: [],
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
        created_at: "2024-01-01T12:00:00Z",
        updated_at: "2024-01-15T14:30:00Z",
      },
      warnings: [],
    });

    const result = await getFormData({
      applicationId: "app1",
      appFormId: "form1",
    });

    expect(mockGetApplicationFormDetailsForPrint).not.toHaveBeenCalled();
    expect(mockGetApplicationFormDetails).toHaveBeenCalledWith("app1", "form1");
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
        createdAt: "2024-01-01T12:00:00Z",
        updatedAt: "2024-01-15T14:30:00Z",
      },
    });
  });

  it("calls print version of function when internal token is present", async () => {
    mockGetSession.mockResolvedValue({ token: "session-token" });
    mockProcessFormSchema.mockReturnValue({
      formSchema: {},
      conditionalValidationRules: {},
    });
    mockGetApplicationFormDetailsForPrint.mockResolvedValue({
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
        created_at: "2024-01-01T12:00:00Z",
        updated_at: "2024-01-15T14:30:00Z",
      },
      warnings: [],
    });

    const result = await getFormData({
      applicationId: "app1",
      appFormId: "form1",
      internalToken: "internal-token",
    });

    expect(mockGetSession).not.toHaveBeenCalled();
    expect(mockGetApplicationFormDetails).not.toHaveBeenCalled();
    expect(mockGetApplicationFormDetailsForPrint).toHaveBeenCalledWith(
      "internal-token",
      "app1",
      "form1",
    );
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
        createdAt: "2024-01-01T12:00:00Z",
        updatedAt: "2024-01-15T14:30:00Z",
      },
    });
  });
});
