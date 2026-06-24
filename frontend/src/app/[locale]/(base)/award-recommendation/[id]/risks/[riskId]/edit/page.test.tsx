import { render, screen } from "@testing-library/react";
import { identity } from "lodash";
import {
  AwardRecommendationDetails,
  AwardRecommendationRisk,
} from "src/types/awardRecommendationTypes";
import { LocalizedPageProps } from "src/types/intl";
import { FeatureFlaggedPageWrapper } from "src/types/uiTypes";
import {
  mockAwardRecommendationDetails,
  mockAwardRecommendationSubmissions,
} from "src/utils/testing/fixtures";

import { FunctionComponent, ReactNode } from "react";

import EditRiskPageContent from "./page";

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

const mockRisk: AwardRecommendationRisk = {
  award_recommendation_risk_id: "risk-id-123",
  award_recommendation_risk_number: "RSK-26-00001",
  risk_number: 1,
  comment: "Existing risk summary",
  award_recommendation_risk_type: "additional_monitoring",
  condition: "Condition 1",
  award_recommendation_application_submission_ids: [
    mockAwardRecommendationSubmissions[0]
      .award_recommendation_application_submission_id,
  ],
  applications: [],
};

const mockGetAwardRecommendationDetails = jest
  .fn()
  .mockResolvedValue(mockAwardRecommendationDetails);
const mockGetAwardRecommendationRisk = jest.fn().mockResolvedValue(mockRisk);
const mockGetAwardRecommendationSubmissionsForRisk = jest
  .fn()
  .mockResolvedValue(mockAwardRecommendationSubmissions);

jest.mock("src/services/fetch/fetchers/awardRecommendationFetcher", () => ({
  getAwardRecommendationDetails: (id: string) =>
    mockGetAwardRecommendationDetails(
      id,
    ) as Promise<AwardRecommendationDetails>,
  getAwardRecommendationRisk: (awardRecommendationId: string, riskId: string) =>
    mockGetAwardRecommendationRisk(
      awardRecommendationId,
      riskId,
    ) as Promise<AwardRecommendationRisk | null>,
  getAwardRecommendationSubmissionsForRisk: (
    awardRecommendationId: string,
    submissionIds: string[],
  ) =>
    mockGetAwardRecommendationSubmissionsForRisk(
      awardRecommendationId,
      submissionIds,
    ),
}));

jest.mock(
  "src/app/[locale]/(base)/award-recommendation/[id]/risks/[riskId]/edit/_components/EditRiskForm",
  () => ({
    __esModule: true,
    default: () => <div data-testid="edit-risk-form" />,
  }),
);

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

describe("EditRiskPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    withFeatureFlagMock.mockImplementation(
      (
        WrappedComponent: FunctionComponent<LocalizedPageProps>,
        _featureFlagName: string,
        _onEnabled: onEnabled,
      ) =>
        (props: {
          params: Promise<{ locale: string; id: string; riskId: string }>;
        }) =>
          WrappedComponent(props) as unknown,
    );
    mockGetAwardRecommendationDetails.mockResolvedValue(
      mockAwardRecommendationDetails,
    );
    mockGetAwardRecommendationRisk.mockResolvedValue(mockRisk);
    mockGetAwardRecommendationSubmissionsForRisk.mockResolvedValue(
      mockAwardRecommendationSubmissions,
    );
  });

  it("renders the edit risk form page", async () => {
    const params = Promise.resolve({
      locale: "en",
      id: "test-award-id",
      riskId: "risk-id-123",
    });

    const page = await EditRiskPageContent({ params });
    render(page);

    expect(screen.getByTestId("edit-risk-form")).toBeInTheDocument();
    expect(
      screen.getByTestId("award-recommendation-hero-fallback"),
    ).toBeInTheDocument();
  });

  it("shows error when risk is not found", async () => {
    mockGetAwardRecommendationRisk.mockResolvedValue(null);

    const params = Promise.resolve({
      locale: "en",
      id: "test-award-id",
      riskId: "missing-risk-id",
    });

    const page = await EditRiskPageContent({ params });
    render(page);

    expect(
      screen.getByText("errorHeadingAwardRecommendationRisk"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("awardRecommendationRiskFetchError"),
    ).toBeInTheDocument();
  });
});
