import { render, screen } from "@testing-library/react";
import { identity } from "lodash";
import { AwardRecommendationDetails } from "src/types/awardRecommendationTypes";
import { LocalizedPageProps } from "src/types/intl";
import { FeatureFlaggedPageWrapper } from "src/types/uiTypes";
import { mockAwardRecommendationDetails } from "src/utils/testing/fixtures";

import { FunctionComponent, ReactNode } from "react";

import AddRiskPageContent from "./page";

type onEnabled = (props: LocalizedPageProps) => ReactNode;

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
}));

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  use: jest.fn(() => ({
    locale: "en",
  })),
  Suspense: ({ fallback }: { fallback: React.Component }) => fallback,
}));

const mockGetAwardRecommendationDetails = jest
  .fn()
  .mockResolvedValue(mockAwardRecommendationDetails);

jest.mock("src/services/fetch/fetchers/awardRecommendationFetcher", () => ({
  getAwardRecommendationDetails: (id: string) =>
    mockGetAwardRecommendationDetails(
      id,
    ) as Promise<AwardRecommendationDetails>,
}));

const withFeatureFlagMock = jest.fn();

jest.mock("src/services/featureFlags/withFeatureFlag", () => ({
  __esModule: true,
  default:
    (
      WrappedComponent: FunctionComponent<LocalizedPageProps>,
      _featureFlagName: string,
      onEnabled: onEnabled,
    ) =>
    (props: LocalizedPageProps) =>
      (
        withFeatureFlagMock as FeatureFlaggedPageWrapper<
          LocalizedPageProps,
          ReactNode
        >
      )(
        WrappedComponent,
        _featureFlagName,
        onEnabled,
      )(props) as FunctionComponent<LocalizedPageProps>,
}));

jest.mock("src/services/auth/session", () => ({
  getSession: jest.fn().mockResolvedValue(null),
}));

jest.mock("src/hooks/useSelectedSubmissions", () => ({
  useSelectedSubmissions: jest.fn(() => ({
    selectedSubmissions: [],
    hasSelections: false,
  })),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe("AddRiskPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    withFeatureFlagMock.mockImplementation(
      (
        WrappedComponent: FunctionComponent<LocalizedPageProps>,
        _featureFlagName: string,
        _onEnabled: onEnabled,
      ) =>
        (props: { params: Promise<{ locale: string }> }) =>
          WrappedComponent(props) as unknown,
    );
    mockGetAwardRecommendationDetails.mockResolvedValue(
      mockAwardRecommendationDetails,
    );
  });

  it("renders the add risk form page", async () => {
    const params = Promise.resolve({
      locale: "en",
      id: "test-award-id",
    });

    const page = await AddRiskPageContent({ params });
    render(page);

    expect(screen.getByText("noSelectionsMessage")).toBeInTheDocument();
  });

  it("renders hero with back to edit button", async () => {
    const params = Promise.resolve({
      locale: "en",
      id: "test-award-id",
    });

    const page = await AddRiskPageContent({ params });
    render(page);

    expect(
      screen.getByTestId("award-recommendation-hero-fallback"),
    ).toBeInTheDocument();
  });

  it("shows error when award recommendation is not found", async () => {
    mockGetAwardRecommendationDetails.mockRejectedValue(new Error("Not found"));

    const params = Promise.resolve({
      locale: "en",
      id: "invalid-id",
    });

    const page = await AddRiskPageContent({ params });
    render(page);

    expect(
      screen.getByText("errorHeadingAwardRecommendation"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("awardRecommendationFetchError"),
    ).toBeInTheDocument();
  });

  it("shows not found error when details are null", async () => {
    mockGetAwardRecommendationDetails.mockResolvedValue(null);

    const params = Promise.resolve({
      locale: "en",
      id: "test-award-id",
    });

    const page = await AddRiskPageContent({ params });
    render(page);

    expect(
      screen.getByText("errorHeadingAwardRecommendation"),
    ).toBeInTheDocument();
    expect(screen.getByText("awardRecommendationNotFound")).toBeInTheDocument();
  });
});
