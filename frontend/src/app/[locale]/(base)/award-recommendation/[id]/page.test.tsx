import { render, screen } from "@testing-library/react";
import { identity } from "lodash";
import AwardRecommendationPage from "src/app/[locale]/(base)/award-recommendation/[id]/page";
import { AwardRecommendationDetails } from "src/types/awardRecommendationTypes";
import { LocalizedPageProps } from "src/types/intl";
import { FeatureFlaggedPageWrapper } from "src/types/uiTypes";
import { wrapForExpectedError } from "src/utils/testing/commonTestUtils";
import { mockAwardRecommendationDetails } from "src/utils/testing/fixtures";

import { FunctionComponent, ReactNode } from "react";

type onEnabled = (props: LocalizedPageProps) => ReactNode;

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
}));

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  use: jest.fn(() => ({
    locale: "en",
  })),
}));

const mockRedirect = jest.fn();
jest.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => {
    mockRedirect(...args);
    throw new Error("NEXT_REDIRECT");
  },
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

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  Suspense: ({ fallback }: { fallback: React.Component }) => fallback,
}));

jest.mock("next-intl", () => ({
  useTranslations: () => identity,
}));

const awardRecommendationParams = Promise.resolve({
  locale: "en",
  id: "AR-26-0001",
});

describe("AwardRecommendationPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when feature flag is enabled", () => {
    beforeEach(() => {
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

    it("includes the AwardRecommendationHero component in the page", async () => {
      const component = await AwardRecommendationPage({
        params: awardRecommendationParams,
      });
      render(component);
      expect(
        screen.getByTestId("award-recommendation-hero-fallback"),
      ).toBeInTheDocument();
    });

    it("renders page for Award Recommendation", async () => {
      const component = await AwardRecommendationPage({
        params: awardRecommendationParams,
      });
      render(component);
      expect(await screen.findByText("opportunity")).toBeVisible();
    });

    it("renders opportunity details on the page", async () => {
      const component = await AwardRecommendationPage({
        params: awardRecommendationParams,
      });
      render(component);

      expect(
        await screen.findByText(
          mockAwardRecommendationDetails.opportunity.opportunity_title,
        ),
      ).toBeVisible();
      expect(
        await screen.findByText(
          mockAwardRecommendationDetails.opportunity.opportunity_number,
        ),
      ).toBeVisible();
    });

    it("renders 'No summary available' when opportunity has no summary description", async () => {
      mockGetAwardRecommendationDetails.mockResolvedValue({
        ...mockAwardRecommendationDetails,
        opportunity: {
          ...mockAwardRecommendationDetails.opportunity,
          summary: {
            ...mockAwardRecommendationDetails.opportunity.summary,
            summary_description: "",
          },
        },
      });

      const component = await AwardRecommendationPage({
        params: awardRecommendationParams,
      });
      render(component);

      expect(await screen.findByText("noSummaryAvailable")).toBeVisible();
    });

    it("calls getAwardRecommendationDetails with expected id", async () => {
      mockGetAwardRecommendationDetails.mockResolvedValue(
        mockAwardRecommendationDetails,
      );

      await AwardRecommendationPage({
        params: awardRecommendationParams,
        searchParams: Promise.resolve({}),
      });

      expect(mockGetAwardRecommendationDetails).toHaveBeenCalledWith(
        "AR-26-0001",
      );
    });

    it("displays recommendation method field in recommendation section", async () => {
      const component = await AwardRecommendationPage({
        params: awardRecommendationParams,
      });
      render(component);

      expect(
        await screen.findByText("recommendationMethod.label"),
      ).toBeVisible();
    });

    it("displays recommendation method details field in recommendation section", async () => {
      const component = await AwardRecommendationPage({
        params: awardRecommendationParams,
      });
      render(component);

      expect(
        await screen.findByText("recommendationMethodDetails.label"),
      ).toBeVisible();
    });

    it("displays other key information field in recommendation section", async () => {
      const component = await AwardRecommendationPage({
        params: awardRecommendationParams,
      });
      render(component);

      expect(
        await screen.findByText("otherKeyInformation.label"),
      ).toBeVisible();
    });

    it("handles 404 error gracefully when award recommendation not found", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      mockGetAwardRecommendationDetails.mockRejectedValue({
        response: { status: 404 },
      });

      const component = await AwardRecommendationPage({
        params: awardRecommendationParams,
        searchParams: Promise.resolve({}),
      });
      render(component);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("handles generic error when fetching award recommendation fails", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      mockGetAwardRecommendationDetails.mockRejectedValue(
        new Error("Network error"),
      );

      const component = await AwardRecommendationPage({
        params: awardRecommendationParams,
        searchParams: Promise.resolve({}),
      });

      render(component);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to fetch award recommendation details",
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("when feature flag is disabled", () => {
    beforeEach(() => {
      withFeatureFlagMock.mockImplementation(
        (
          _WrappedComponent: FunctionComponent<LocalizedPageProps>,
          _featureFlagName: string,
          onEnabled: onEnabled,
        ) =>
          (props: { params: Promise<{ locale: string }> }) =>
            onEnabled(props) as unknown,
      );
    });

    it("redirects to /maintenance", async () => {
      await wrapForExpectedError(() => {
        return AwardRecommendationPage({
          params: awardRecommendationParams,
        });
      });

      expect(mockRedirect).toHaveBeenCalledWith("/maintenance");
    });
  });
});
