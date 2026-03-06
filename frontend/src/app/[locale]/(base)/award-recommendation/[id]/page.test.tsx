import { render, screen } from "@testing-library/react";
import { identity } from "lodash";
import AwardRecommendationPage from "src/app/[locale]/(base)/award-recommendation/[id]/page";
import * as opportunityFetcher from "src/services/fetch/fetchers/opportunityFetcher";
import { LocalizedPageProps } from "src/types/intl";
import { FeatureFlaggedPageWrapper } from "src/types/uiTypes";
import { wrapForExpectedError } from "src/utils/testing/commonTestUtils";

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

jest.mock("src/services/fetch/fetchers/opportunityFetcher");

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  Suspense: ({ fallback }: { fallback: React.Component }) => fallback,
}));

jest.mock("next-intl", () => ({
  useTranslations: () => identity,
}));

const mockOpportunityDetail = {
  opportunity_id: "6a483cd8-9169-418a-8dfb-60fa6e6f51e5",
  legacy_opportunity_id: 1,
  opportunity_status: "posted" as const,
  opportunity_title: "Test Funding Opportunity",
  opportunity_number: "OPP-2024-001",
  agency_code: "ABC",
  agency_name: "Test Agency",
  top_level_agency_name: "Test Top Level Agency",
  category: "test-category",
  category_explanation: "This is a test category",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  opportunity_assistance_listings: [],
  attachments: [],
  competitions: null,
  summary: {
    summary_description: "",
    close_date: null,
    is_forecast: false,
    post_date: "2024-01-01",
    additional_info_url: null,
    additional_info_url_description: null,
    agency_code: "ABC",
    agency_contact_description: null,
    agency_email_address: null,
    agency_email_address_description: null,
    agency_name: "Test Agency",
    agency_phone_number: null,
    applicant_eligibility_description: null,
    applicant_types: null,
    archive_date: null,
    award_ceiling: null,
    award_floor: null,
    close_date_description: null,
    estimated_total_program_funding: null,
    expected_number_of_awards: null,
    fiscal_year: null,
    forecasted_award_date: null,
    forecasted_close_date: null,
    forecasted_close_date_description: null,
    forecasted_post_date: null,
    forecasted_project_start_date: null,
    funding_categories: null,
    funding_category_description: null,
    funding_instruments: null,
    is_cost_sharing: null,
    version_number: 1,
  },
};

const mockOpportunityData = {
  data: mockOpportunityDetail,
  message: "Success",
  status_code: 200,
};

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

      jest
        .spyOn(opportunityFetcher, "getOpportunityDetails")
        .mockResolvedValue(mockOpportunityData);
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

    it("renders page title", async () => {
      const component = await AwardRecommendationPage({
        params: awardRecommendationParams,
      });
      render(component);
      expect(await screen.findByText("pageTitle")).toBeVisible();
    });

    it("renders opportunity details on the page", async () => {
      const component = await AwardRecommendationPage({
        params: awardRecommendationParams,
      });
      render(component);

      expect(
        await screen.findByText(mockOpportunityDetail.opportunity_title),
      ).toBeVisible();
      expect(
        await screen.findByText(mockOpportunityDetail.opportunity_number),
      ).toBeVisible();
    });

    it("renders 'No summary available' when opportunity has no summary description", async () => {
      jest
        .spyOn(opportunityFetcher, "getOpportunityDetails")
        .mockResolvedValue({
          ...mockOpportunityData,
          data: {
            ...mockOpportunityDetail,
            summary: {
              ...mockOpportunityDetail.summary,
              summary_description: null,
            },
          },
        });

      const component = await AwardRecommendationPage({
        params: awardRecommendationParams,
      });
      render(component);

      expect(await screen.findByText("No summary available")).toBeVisible();
    });

    it("calls getOpportunityDetails with expected id", async () => {
      jest
        .spyOn(opportunityFetcher, "getOpportunityDetails")
        .mockResolvedValue(mockOpportunityData);

      await AwardRecommendationPage({
        params: awardRecommendationParams,
        searchParams: Promise.resolve({}),
      });

      expect(opportunityFetcher.getOpportunityDetails).toHaveBeenCalledWith(
        "6a483cd8-9169-418a-8dfb-60fa6e6f51e5",
      );
    });

    it("handles 404 error gracefully when opportunity not found", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      jest
        .spyOn(opportunityFetcher, "getOpportunityDetails")
        .mockRejectedValue({
          response: { status: 404 },
        });

      const component = await AwardRecommendationPage({
        params: awardRecommendationParams,
        searchParams: Promise.resolve({ opportunityId: "non-existent" }),
      });
      render(component);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("handles generic error when fetching opportunity fails", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      jest
        .spyOn(opportunityFetcher, "getOpportunityDetails")
        .mockRejectedValue(new Error("Network error"));

      const component = await AwardRecommendationPage({
        params: awardRecommendationParams,
        searchParams: Promise.resolve({ opportunityId: "123" }),
      });

      render(component);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to fetch opportunity details",
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
