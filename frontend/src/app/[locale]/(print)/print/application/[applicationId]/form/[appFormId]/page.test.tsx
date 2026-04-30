import { render, screen } from "@testing-library/react";
import FormPage, {
  generateMetadata,
} from "src/app/[locale]/(print)/print/application/[applicationId]/form/[appFormId]/page";
import { wrapForExpectedError } from "src/utils/testing/commonTestUtils";

const mockGetFormData = jest.fn();

jest.mock("src/utils/getFormData", () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockGetFormData(...args) as unknown,
}));

const mockHeadersGet = jest.fn<string | null, [string]>();

jest.mock("next/headers", () => ({
  headers: () =>
    Promise.resolve({
      get: (key: string) => mockHeadersGet(key),
    }),
}));

const mockNotFound = jest.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

const mockRedirect = jest.fn((..._args: unknown[]) => {
  throw new Error("NEXT_REDIRECT");
});

jest.mock("next/navigation", () => ({
  notFound: () => mockNotFound(),
  redirect: (...args: unknown[]) => mockRedirect(...args),
}));

jest.mock("src/app/[locale]/(base)/error/page", () => ({
  __esModule: true,
  default: () => <div data-testid="top-level-error" />,
}));

jest.mock("src/components/applyForm/PrintForm", () => ({
  __esModule: true,
  default: () => <div data-testid="print-form" />,
}));

jest.mock("src/components/applyForm/utils", () => ({
  addPrintWidgetToFields: (schema: unknown) => schema,
}));

const mockFormData = {
  data: {
    applicationResponse: { foo: "bar" },
    applicationName: "Test Application",
    formId: "form1",
    formName: "Test Form",
    formSchema: {},
    formUiSchema: {},
    formValidationWarnings: null,
    applicationAttachments: [],
  },
};

const buildParams = (overrides = {}) =>
  Promise.resolve({
    applicationId: "app1",
    appFormId: "form1",
    locale: "en",
    setAttachmentsChanged: jest.fn(),
    ...overrides,
  });

describe("FormPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the form when called with an internal token and valid data", async () => {
    mockHeadersGet.mockReturnValue("some-internal-token");
    mockGetFormData.mockResolvedValue(mockFormData);

    const component = await FormPage({ params: buildParams() });
    render(component);

    expect(screen.getByTestId("print-form")).toBeInTheDocument();
    expect(screen.getByText("Test Form")).toBeInTheDocument();
    expect(mockGetFormData).toHaveBeenCalledWith({
      applicationId: "app1",
      appFormId: "form1",
      internalToken: "some-internal-token",
    });
  });

  it("renders the form when called without an internal token (session JWT path)", async () => {
    mockHeadersGet.mockReturnValue(null);
    mockGetFormData.mockResolvedValue(mockFormData);

    const component = await FormPage({ params: buildParams() });
    render(component);

    expect(screen.getByTestId("print-form")).toBeInTheDocument();
    expect(mockGetFormData).toHaveBeenCalledWith({
      applicationId: "app1",
      appFormId: "form1",
      internalToken: undefined,
    });
  });

  it("redirects to /unauthenticated when getFormData returns UnauthorizedError", async () => {
    mockHeadersGet.mockReturnValue(null);
    mockGetFormData.mockResolvedValue({ error: "UnauthorizedError" });

    await wrapForExpectedError(() => FormPage({ params: buildParams() }));

    expect(mockRedirect).toHaveBeenCalledWith("/unauthenticated");
    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it("calls notFound() when getFormData returns NotFound error", async () => {
    mockHeadersGet.mockReturnValue("some-internal-token");
    mockGetFormData.mockResolvedValue({ error: "NotFound" });

    await wrapForExpectedError(() => FormPage({ params: buildParams() }));

    expect(mockNotFound).toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("renders TopLevelError when getFormData returns a TopLevelError", async () => {
    mockHeadersGet.mockReturnValue("some-internal-token");
    mockGetFormData.mockResolvedValue({ error: "TopLevelError" });

    const component = await FormPage({ params: buildParams() });
    render(component);

    expect(screen.getByTestId("top-level-error")).toBeInTheDocument();
  });
});

describe("generateMetadata", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the form name as title when data is available with internal token", async () => {
    mockHeadersGet.mockReturnValue("some-internal-token");
    mockGetFormData.mockResolvedValue(mockFormData);

    const meta = await generateMetadata({ params: buildParams() });

    expect(meta.title).toBe("Test Form");
    expect(mockGetFormData).toHaveBeenCalledWith({
      applicationId: "app1",
      appFormId: "form1",
      internalToken: "some-internal-token",
    });
  });

  it("returns the form name as title when data is available via session JWT", async () => {
    mockHeadersGet.mockReturnValue(null);
    mockGetFormData.mockResolvedValue(mockFormData);

    const meta = await generateMetadata({ params: buildParams() });

    expect(meta.title).toBe("Test Form");
    expect(mockGetFormData).toHaveBeenCalledWith({
      applicationId: "app1",
      appFormId: "form1",
      internalToken: undefined,
    });
  });

  it("returns empty title when getFormData returns an error", async () => {
    mockHeadersGet.mockReturnValue(null);
    mockGetFormData.mockResolvedValue({ error: "UnauthorizedError" });

    const meta = await generateMetadata({ params: buildParams() });

    expect(meta.title).toBe("");
  });
});
