import { render, screen } from "@testing-library/react";
import FormPage from "src/app/[locale]/(base)/workspace/applications/[applicationId]/form/[appFormId]/page";

import { JSX } from "react";

const mockGetFormData = jest.fn();
const mockGetApplicationDetails = jest.fn();
const mockRedirect = jest.fn();
const mockNotFound = jest.fn();

jest.mock("src/services/featureFlags/withFeatureFlag", () => ({
  __esModule: true,
  default: (component: unknown) => component,
}));

jest.mock("src/utils/getFormData", () => ({
  __esModule: true,
  default: (...args: unknown[]): unknown => mockGetFormData(...args),
}));

jest.mock("src/services/fetch/fetchers/applicationFetcher", () => ({
  getApplicationDetails: (...args: unknown[]): unknown =>
    mockGetApplicationDetails(...args),
}));

jest.mock("next-intl/server", () => ({
  getTranslations: () => (key: string) => key,
}));

jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]): unknown => mockRedirect(...args),
  notFound: (): unknown => mockNotFound(),
}));

jest.mock("src/components/core/UnauthenticatedMessage", () => ({
  UnauthenticatedMessage: () => <div>SHARED SIGNED OUT MESSAGE</div>,
}));

jest.mock("src/app/[locale]/(base)/error/page", () => ({
  __esModule: true,
  default: () => <div>TOP LEVEL ERROR</div>,
}));

jest.mock(
  "src/app/[locale]/(base)/workspace/applications/[applicationId]/form/[appFormId]/_components/ApplyForm",
  () => ({ __esModule: true, default: () => <div>APPLY FORM</div> }),
);

const renderFormPage = async () => {
  const page = await (
    FormPage as unknown as (props: {
      params: Promise<{
        applicationId: string;
        appFormId: string;
        locale: string;
      }>;
    }) => Promise<JSX.Element>
  )({
    params: Promise.resolve({
      applicationId: "app-1",
      appFormId: "form-1",
      locale: "en",
    }),
  });
  render(page);
};

describe("application form page", () => {
  beforeEach(() => {
    mockGetApplicationDetails.mockResolvedValue({
      status_code: 200,
      data: { application_status: "in_progress" },
    });
  });
  afterEach(() => jest.clearAllMocks());

  it("renders the shared signed-out message at the requested URL when the session is not valid", async () => {
    mockGetFormData.mockResolvedValue({ error: "UnauthorizedError" });

    await renderFormPage();

    expect(screen.getByText("SHARED SIGNED OUT MESSAGE")).toBeInTheDocument();
    expect(screen.queryByText("APPLY FORM")).not.toBeInTheDocument();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("still renders the error page for other form errors", async () => {
    mockGetFormData.mockResolvedValue({ error: "TopLevelError" });

    await renderFormPage();

    expect(screen.getByText("TOP LEVEL ERROR")).toBeInTheDocument();
    expect(
      screen.queryByText("SHARED SIGNED OUT MESSAGE"),
    ).not.toBeInTheDocument();
  });
});
