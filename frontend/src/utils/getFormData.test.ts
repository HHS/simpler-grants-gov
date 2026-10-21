import { ApiRequestError } from "src/errors";
import getFormData from "src/utils/getFormData";

const mockGetSession = jest.fn();
const mockGetApplicationFormDetails = jest.fn();
const mockProcessFormSchema = jest.fn();
const mockValidateUISchema = jest.fn();
const mockGetApplicationFormDetailsForPrint = jest.fn();
const mockLoggerError = jest.fn();
const mockLoggerWarn = jest.fn();

jest.mock("src/services/logger/simplerLogger", () => ({
  logger: {
    error: (...args: unknown[]) => mockLoggerError(...args) as unknown,
    warn: (...args: unknown[]) => mockLoggerWarn(...args) as unknown,
  },
}));

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
  unimplementedRuleKeys: () => [],
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
      data: { form: { form_id: "form1" }, application_response: {} },
    });

    const result = await getFormData({
      applicationId: "app1",
      appFormId: "form1",
    });

    expect(result).toEqual({ error: "TopLevelError" });
    expect(mockLoggerError).toHaveBeenCalledWith(
      { applicationId: "app1", appFormId: "form1", status_code: 500 },
      "Error retrieving form details",
    );
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
    mockValidateUISchema.mockReturnValue([
      {
        instancePath: "/0/children",
        schemaPath: "#/additionalProperties",
        keyword: "additionalProperties",
        params: { additionalProperty: "widgets" },
        message: "must NOT have additional properties",
      },
    ]);
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
    // ajv only names the offending key in params, so the summary has to carry it
    expect(mockLoggerError).toHaveBeenCalledWith(
      {
        formId: "form1",
        schemaErrors:
          '/0/children: must NOT have additional properties {"additionalProperty":"widgets"}',
      },
      "Error validating form ui schema",
    );
  });

  it("logs ui schema validation failures under the cap without a suffix", async () => {
    mockGetSession.mockResolvedValue({ token: "session-token" });
    mockValidateUISchema.mockReturnValue([
      { instancePath: "", message: "first" },
      { instancePath: "/1", message: "second" },
    ]);
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

    await getFormData({ applicationId: "app1", appFormId: "form1" });

    expect(mockLoggerError).toHaveBeenCalledWith(
      { formId: "form1", schemaErrors: "/: first; /1: second" },
      "Error validating form ui schema",
    );
  });

  it("logs ui schema validation failures as a single capped summary line", async () => {
    mockGetSession.mockResolvedValue({ token: "session-token" });
    mockValidateUISchema.mockReturnValue(
      Array.from({ length: 7 }, (_, index) => ({
        instancePath: `/${index}`,
        message: `error ${index}`,
      })),
    );
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

    await getFormData({ applicationId: "app1", appFormId: "form1" });

    expect(mockLoggerError).toHaveBeenCalledWith(
      {
        formId: "form1",
        schemaErrors:
          "/0: error 0; /1: error 1; /2: error 2; /3: error 3; /4: error 4 (+2 more)",
      },
      "Error validating form ui schema",
    );
  });

  it("returns UnauthorizedError when the form-data request is rejected with status 401", async () => {
    mockGetSession.mockResolvedValue({ token: "session-token" });
    mockGetApplicationFormDetails.mockRejectedValue(
      new ApiRequestError("Unauthorized", "APIRequestError", 401),
    );

    const result = await getFormData({
      applicationId: "app1",
      appFormId: "form1",
    });

    expect(result).toEqual({ error: "UnauthorizedError" });
  });

  it("returns NotFound when the form-data request is rejected with status 404", async () => {
    mockGetSession.mockResolvedValue({ token: "session-token" });
    mockGetApplicationFormDetails.mockRejectedValue(
      new ApiRequestError("Not found", "APIRequestError", 404),
    );

    const result = await getFormData({
      applicationId: "app1",
      appFormId: "form1",
    });

    expect(result).toEqual({ error: "NotFound" });
  });

  it("returns TopLevelError when the rejected form-data request is neither unauthorized nor not found", async () => {
    mockGetSession.mockResolvedValue({ token: "session-token" });
    mockGetApplicationFormDetails.mockRejectedValue(
      new ApiRequestError("Internal server error", "APIRequestError", 500),
    );

    const result = await getFormData({
      applicationId: "app1",
      appFormId: "form1",
    });

    expect(result).toEqual({ error: "TopLevelError" });
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
        formRenderer: "sgg",
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
        formRenderer: "sgg",
        formValidationWarnings: [],
        createdAt: "2024-01-01T12:00:00Z",
        updatedAt: "2024-01-15T14:30:00Z",
      },
    });
  });

  describe("a form rendered with JSON Forms", () => {
    const formSchema = {
      type: "object",
      properties: {
        title: { type: "string", title: "Title" },
      },
    };
    const jsonFormsUiSchema = {
      type: "Group",
      label: "Test",
      elements: [
        {
          type: "Group",
          label: "Project Details",
          elements: [
            { type: "Control", scope: "#/properties/title" },
            { type: "Control", scope: "#/properties/missing" },
          ],
        },
      ],
    };

    beforeEach(() => {
      mockGetSession.mockResolvedValue({ token: "session-token" });
      mockProcessFormSchema.mockReturnValue({
        formSchema,
        conditionalValidationRules: {},
      });
      mockGetApplicationFormDetails.mockResolvedValue({
        status_code: 200,
        data: {
          form: {
            form_id: "form1",
            form_name: "Test",
            form_json_schema: formSchema,
            form_ui_schema: jsonFormsUiSchema,
            form_renderer: "jsonforms",
          },
          application_form_id: "form1",
          application_response: {},
          application_name: "cool application",
          application_attachments: [],
        },
        warnings: [],
      });
    });

    it("returns the JSON Forms ui schema alongside its section/field equivalent", async () => {
      const result = await getFormData({
        applicationId: "app1",
        appFormId: "form1",
      });

      expect(result.data?.formRenderer).toEqual("jsonforms");
      expect(result.data?.jsonFormsUiSchema).toEqual(jsonFormsUiSchema);
      expect(result.data?.formUiSchema).toEqual([
        {
          type: "section",
          name: "project-details",
          label: "Project Details",
          children: [{ type: "field", definition: "/properties/title" }],
        },
      ]);
    });

    it("warns about each control no widget can render, since it won't be shown", async () => {
      await getFormData({ applicationId: "app1", appFormId: "form1" });

      expect(mockLoggerWarn).toHaveBeenCalledWith(
        {
          formId: "form1",
          formName: "Test",
          control: "#/properties/missing",
        },
        expect.stringContaining("won't be shown"),
      );
    });
  });
});
