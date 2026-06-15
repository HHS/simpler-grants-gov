import { RJSFSchema } from "@rjsf/utils";

import { handleFormAction } from "./actions";

const mockGetSession = jest.fn();
const mockProcessFormSchema = jest.fn();
const mockShapeFormData = jest.fn();
const mockGetFormDetails = jest.fn();
const mockRevalidateTag = jest.fn();

jest.mock("next/cache", () => ({
  revalidateTag: (tag: string) => mockRevalidateTag(tag) as unknown,
}));

jest.mock("src/services/auth/session", () => ({
  getSession: () => mockGetSession() as unknown,
}));

jest.mock("src/utils/applyForm/applyFormUtils", () => ({
  processFormSchema: (schema: RJSFSchema) =>
    mockProcessFormSchema(schema) as unknown,
  shapeFormData: (data: FormData, schema: RJSFSchema) =>
    mockShapeFormData(data, schema) as unknown,
}));

jest.mock("src/services/fetch/fetchers/formsFetcher", () => ({
  getFormDetails: (id: string) => mockGetFormDetails(id) as unknown,
}));

const genericPayload = {
  applicationId: "1",
  error: false,
  formData: new FormData(),
  formId: "1",
  saved: false,
};

describe("handleFormAction", () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue({ token: "a token" });
    mockProcessFormSchema.mockImplementation((schema: RJSFSchema) => {
      return Promise.resolve({
        formSchema: schema,
      });
    });
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it("it returns error state if not logged in", async () => {
    mockGetSession.mockResolvedValue(null);
    const result = await handleFormAction(genericPayload, new FormData());
    expect(result).toEqual({
      ...genericPayload,
      error: true,
    });
  });
  it("returns error state if error occurs when processing schema", async () => {
    const result = await handleFormAction(genericPayload, new FormData());
    expect(result).toEqual({
      ...genericPayload,
      error: true,
    });
  });
});
