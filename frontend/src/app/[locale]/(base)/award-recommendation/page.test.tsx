import { render, screen } from "@testing-library/react";
import AwardRecommendationPage from "src/app/[locale]/(base)/award-recommendation/page";
import * as opportunityFetcher from "src/services/fetch/fetchers/opportunityFetcher";
import { LocalizedPageProps } from "src/types/intl";
import { FeatureFlaggedPageWrapper } from "src/types/uiTypes";
import { localeParams, useTranslationsMock } from "src/utils/testing/intlMocks";

import React, { FunctionComponent, ReactNode } from "react";

import AwardRecommendationHero from "src/components/award-recommendation/AwardRecommendationHero";

type onEnabled = (props: LocalizedPageProps) => ReactNode;

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

jest.mock("next-intl/server", () => ({
  getTranslations: jest.fn(() => useTranslationsMock()),
}));

jest.mock("src/services/fetch/fetchers/opportunityFetcher");

const mockOpportunityDetail = {
  opportunity_id: "123",
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
    summary_description: "<p>This is a test opportunity summary.</p>",
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
    });

    it("includes the AwardRecommendationHero component in the page", async () => {
      const component = (await AwardRecommendationPage({
        params: localeParams,
      })) as React.ReactElement;

      const children = React.Children.toArray(
        (component.props as { children?: React.ReactNode }).children,
      );
      const hasHero = children.some(
        (child) =>
          React.isValidElement(child) && child.type === AwardRecommendationHero,
      );

      expect(hasHero).toBe(true);
    });

    it("renders page title", async () => {
      const component = await AwardRecommendationPage({
        params: localeParams,
      });
      render(component);
      expect(await screen.findByText("pageTitle")).toBeVisible();
    });

    it("does not fetch opportunity when no id search param provided", async () => {
      const component = await AwardRecommendationPage({
        params: localeParams,
        searchParams: Promise.resolve({}),
      });
      render(component);

      expect(opportunityFetcher.getOpportunityDetails).not.toHaveBeenCalled();
      expect(await screen.findByText("pageTitle")).toBeVisible();
    });

    it("calls getOpportunityDetails when id search param is provided", async () => {
      jest
        .spyOn(opportunityFetcher, "getOpportunityDetails")
        .mockResolvedValue(mockOpportunityData);

      await AwardRecommendationPage({
        params: localeParams,
        searchParams: Promise.resolve({ id: "123" }),
      });

      expect(opportunityFetcher.getOpportunityDetails).toHaveBeenCalledWith(
        "123",
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
        params: localeParams,
        searchParams: Promise.resolve({ id: "non-existent" }),
      });
      render(component);

      expect(consoleSpy).toHaveBeenCalled();
      expect(await screen.findByText("pageTitle")).toBeVisible();

      consoleSpy.mockRestore();
    });

    it("handles generic error when fetching opportunity fails", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      jest
        .spyOn(opportunityFetcher, "getOpportunityDetails")
        .mockRejectedValue(new Error("Network error"));

      const component = await AwardRecommendationPage({
        params: localeParams,
        searchParams: Promise.resolve({ id: "123" }),
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
      try {
        await AwardRecommendationPage({
          params: localeParams,
        });
        throw new Error("Expected redirect to throw");
      } catch (error) {
        expect(mockRedirect).toHaveBeenCalledWith("/maintenance");
      }
    });
  });
});
