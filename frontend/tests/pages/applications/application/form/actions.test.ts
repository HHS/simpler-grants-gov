import { getFormDetails } from "src/services/fetch/fetchers/formsFetcher";

import { handleFormAction } from "src/components/applyForm/actions";
import { shapeFormData } from "src/components/applyForm/utils";

const mockGetSession = jest.fn();
const mockProcessFormSchema = jest.fn();
const mockShapeFormData = jest.fn();
const mockGetFormDetails = jest.fn();

jest.mock("src/services/auth/session", () => ({
  getSession: () => mockGetSession(),
}));

jest.mock("src/components/applyForm/utils", () => ({
  processFormSchema: (schema) => mockProcessFormSchema(schema),
  shapeFormData: (data, schema) => mockShapeFormData(data, schema),
}));

jest.mock("src/services/fetch/fetchers/formsFetcher", () => ({
  getFormDetails: (id) => mockGetFormDetails(id),
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
    mockProcessFormSchema.mockImplementation((schema) => {
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
