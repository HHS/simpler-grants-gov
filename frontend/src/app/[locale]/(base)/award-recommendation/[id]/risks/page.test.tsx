import { render, screen } from "@testing-library/react";
import { identity } from "lodash";
import { getAwardRecommendationDetails } from "src/services/fetch/fetchers/awardRecommendationFetcher";
import { AwardRecommendationDetails } from "src/types/awardRecommendationTypes";
import { LocalizedPageProps } from "src/types/intl";
import { FeatureFlaggedPageWrapper } from "src/types/uiTypes";
import { mockAwardRecommendationDetails } from "src/utils/testing/fixtures";

import { FunctionComponent, ReactNode } from "react";

import AwardRecommendationRisksPageContent from "./page";

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

const mockGetAwardRecommendationDetails = jest
  .fn()
  .mockResolvedValue(mockAwardRecommendationDetails);

jest.mock("src/services/fetch/fetchers/awardRecommendationFetcher", () => ({
  getAwardRecommendationDetails: (
    id: string,
  ): Promise<AwardRecommendationDetails> =>
    mockGetAwardRecommendationDetails(
      id,
    ) as Promise<AwardRecommendationDetails>,
}));

jest.mock("src/services/auth/session", () => ({
  getSession: jest.fn().mockResolvedValue(null),
}));

jest.mock("src/hooks/useClientFetch", () => ({
  useClientFetch: jest.fn(() => ({
    clientFetch: jest.fn().mockResolvedValue({
      data: [],
      pagination_info: { total_pages: 1 },
    }),
  })),
}));

jest.mock(
  "src/components/award-recommendation/AwardRecommendationHero",
  () => ({
    __esModule: true,
    default: () => <div data-testid="award-recommendation-hero">Hero</div>,
  }),
);

jest.mock("src/components/award-recommendation/RisksTable", () => ({
  __esModule: true,
  default: ({ awardRecommendationId }: { awardRecommendationId: string }) => (
    <div data-testid="risks-table">Risks Table for {awardRecommendationId}</div>
  ),
}));

describe("AwardRecommendationRisksPage", () => {
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

  it("renders the risks page with table", async () => {
    const params = Promise.resolve({
      locale: "en",
      id: "test-award-id",
    });

    const page = await AwardRecommendationRisksPageContent({ params });
    render(page);

    expect(screen.getByText("risks.heading")).toBeInTheDocument();
    expect(screen.getByText("risks.description")).toBeInTheDocument();
    expect(screen.getByTestId("risks-table")).toBeInTheDocument();
    expect(
      screen.getByText("Risks Table for test-award-id"),
    ).toBeInTheDocument();
  });

  it("shows error when award recommendation is not found", async () => {
    mockGetAwardRecommendationDetails.mockRejectedValue(new Error("Not found"));

    const params = Promise.resolve({
      locale: "en",
      id: "invalid-id",
    });

    const page = await AwardRecommendationRisksPageContent({ params });
    render(page);

    expect(
      screen.getByText("errorHeadingAwardRecommendation"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("awardRecommendationFetchError"),
    ).toBeInTheDocument();
  });

  it("renders hero with back to edit button", async () => {
    const params = Promise.resolve({
      locale: "en",
      id: "test-award-id",
    });

    const page = await AwardRecommendationRisksPageContent({ params });
    render(page);

    expect(
      screen.getByTestId("award-recommendation-hero-fallback"),
    ).toBeInTheDocument();
  });
});
