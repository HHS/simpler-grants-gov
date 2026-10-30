import { render, screen } from "@testing-library/react";
import ApplicationLandingPage from "src/app/[locale]/(base)/workspace/applications/[applicationId]/page";
import { ApiRequestError, MissingAuthError } from "src/errors";

import { JSX } from "react";

const mockGetApplicationDetails = jest.fn();
const mockRedirect = jest.fn();
const mockNotFound = jest.fn();

jest.mock("src/services/featureFlags/withFeatureFlag", () => ({
  __esModule: true,
  default: (component: unknown) => component,
}));

jest.mock("src/services/fetch/fetchers/applicationFetcher", () => ({
  getApplicationDetails: (...args: unknown[]): unknown =>
    mockGetApplicationDetails(...args),
  getApplicationHistory: jest.fn(),
  getLatestApplicationSubmission: jest.fn(),
}));

jest.mock("src/services/fetch/fetchers/opportunityFetcher", () => ({
  getOpportunityDetails: jest.fn(),
}));

jest.mock("src/services/logger/simplerLogger", () => ({
  logger: { error: jest.fn() },
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
  "src/app/[locale]/(base)/workspace/applications/[applicationId]/_components/ApplicationContainer",
  () => ({ __esModule: true, default: () => <div>APPLICATION</div> }),
);

const renderApplicationPage = async () => {
  const page = await (
    ApplicationLandingPage as unknown as (props: {
      params: Promise<{ applicationId: string; locale: string }>;
    }) => Promise<JSX.Element>
  )({
    params: Promise.resolve({ applicationId: "app-1", locale: "en" }),
  });
  render(page);
};

describe("application landing page", () => {
  afterEach(() => jest.clearAllMocks());

  it("renders the shared signed-out message at the requested URL when the session is missing", async () => {
    mockGetApplicationDetails.mockRejectedValue(new MissingAuthError());

    await renderApplicationPage();

    expect(screen.getByText("SHARED SIGNED OUT MESSAGE")).toBeInTheDocument();
    expect(screen.queryByText("TOP LEVEL ERROR")).not.toBeInTheDocument();
    expect(screen.queryByText("APPLICATION")).not.toBeInTheDocument();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("still renders the error page for other request errors", async () => {
    mockGetApplicationDetails.mockRejectedValue(
      new ApiRequestError("server error", "APIRequestError", 500),
    );

    await renderApplicationPage();

    expect(screen.getByText("TOP LEVEL ERROR")).toBeInTheDocument();
    expect(
      screen.queryByText("SHARED SIGNED OUT MESSAGE"),
    ).not.toBeInTheDocument();
    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it("still calls notFound for a 404", async () => {
    mockGetApplicationDetails.mockRejectedValue(
      new ApiRequestError("not found", "NotFoundError", 404),
    );

    await renderApplicationPage();

    expect(mockNotFound).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByText("SHARED SIGNED OUT MESSAGE"),
    ).not.toBeInTheDocument();
  });
});
