import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { identity } from "lodash";
import AwardRecommendationSubmissionEditPage from "src/app/[locale]/(base)/award-recommendation/[id]/application-submissions/[applicationSubmissionId]/edit/page";
import { AwardRecommendationSubmission } from "src/types/awardRecommendationTypes";
import { LocalizedPageProps } from "src/types/intl";
import { FeatureFlaggedPageWrapper } from "src/types/uiTypes";
import { wrapForExpectedError } from "src/utils/testing/commonTestUtils";
import { mockAwardRecommendationSubmissions } from "src/utils/testing/fixtures";

import { FunctionComponent, ReactNode } from "react";

type onEnabled = (props: LocalizedPageProps) => ReactNode;

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
}));

jest.mock("next-intl", () => ({
  useTranslations: () => identity,
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

const mockGetAwardRecommendationSubmission = jest
  .fn()
  .mockResolvedValue(mockAwardRecommendationSubmissions[0]);

const mockGetAwardRecommendationDetails = jest.fn().mockResolvedValue({
  award_recommendation_number: "AR-26-0002",
});

jest.mock("src/services/fetch/fetchers/awardRecommendationFetcher", () => ({
  getAwardRecommendationSubmission: (
    awardRecommendationId: string,
    applicationSubmissionId: string,
  ): Promise<AwardRecommendationSubmission | null> =>
    mockGetAwardRecommendationSubmission(
      awardRecommendationId,
      applicationSubmissionId,
    ) as Promise<AwardRecommendationSubmission | null>,
  getAwardRecommendationDetails: (
    awardRecommendationId: string,
  ): Promise<{ award_recommendation_number: string }> =>
    mockGetAwardRecommendationDetails(awardRecommendationId) as Promise<{
      award_recommendation_number: string;
    }>,
  updateAwardRecommendationSubmissionDetails: jest.fn(),
}));

const pageParams = Promise.resolve({
  locale: "en",
  id: "AR-26-0001",
  applicationSubmissionId:
    mockAwardRecommendationSubmissions[0]
      .award_recommendation_application_submission_id,
});

describe("AwardRecommendationSubmissionEditPage", () => {
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

      mockGetAwardRecommendationSubmission.mockResolvedValue(
        mockAwardRecommendationSubmissions[0],
      );
      mockGetAwardRecommendationDetails.mockResolvedValue({
        award_recommendation_number: "AR-26-0002",
      });
    });

    it("fetches the application submission details", async () => {
      await AwardRecommendationSubmissionEditPage({
        params: pageParams,
        searchParams: Promise.resolve({}),
      });

      expect(mockGetAwardRecommendationDetails).toHaveBeenCalledWith(
        "AR-26-0001",
      );
      expect(mockGetAwardRecommendationSubmission).toHaveBeenCalledWith(
        "AR-26-0001",
        mockAwardRecommendationSubmissions[0]
          .award_recommendation_application_submission_id,
      );
    });

    it("renders the submission edit hero", async () => {
      const component = await AwardRecommendationSubmissionEditPage({
        params: pageParams,
      });
      render(component);

      expect(
        await screen.findByTestId("award-recommendation-submission-edit-hero"),
      ).toBeVisible();
      expect(
        screen.getByRole("link", {
          name: /submissionEdit.viewOriginalApplication/i,
        }),
      ).toHaveAttribute(
        "href",
        "/workspace/applications/63588df8-f2d1-44ed-a201-5804abba696d",
      );
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "submissionEdit.editTitle",
      );
    });

    it("renders recommendation details fields", async () => {
      const component = await AwardRecommendationSubmissionEditPage({
        params: pageParams,
      });
      render(component);

      expect(await screen.findByText("heading")).toBeVisible();
      expect(screen.getByText("recommendationLabel")).toBeVisible();
      expect(screen.getByText("amountRequestedLabel")).toBeVisible();
      expect(screen.getByText("amountRecommendedLabel")).toBeVisible();
    });

    it("formats recommended amount when the field loses focus", async () => {
      const user = userEvent.setup();
      const component = await AwardRecommendationSubmissionEditPage({
        params: pageParams,
      });
      render(component);

      const recommendedAmountInput = await screen.findByDisplayValue("$50,000");
      await user.clear(recommendedAmountInput);
      await user.type(recommendedAmountInput, "1234");
      expect(recommendedAmountInput).toHaveValue("1234");

      await user.tab();

      expect(recommendedAmountInput).toHaveValue("$1,234");
    });

    it("hides the exception checkbox when recommended_for_funding is selected", async () => {
      const component = await AwardRecommendationSubmissionEditPage({
        params: pageParams,
      });
      render(component);

      expect(
        screen.queryByLabelText("hasExceptionLabel"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("exception-detail-textarea"),
      ).not.toBeInTheDocument();
    });

    it("checks the exception checkbox by default when recommended_without_funding is selected", async () => {
      const user = userEvent.setup();
      const component = await AwardRecommendationSubmissionEditPage({
        params: pageParams,
      });
      render(component);

      const recommendationSelect = await screen.findByRole("combobox");
      await user.selectOptions(
        recommendationSelect,
        "recommended_without_funding",
      );

      const checkbox = screen.getByLabelText("hasExceptionLabel");
      expect(checkbox).toBeChecked();
      expect(screen.getByTestId("exception-detail-textarea")).toBeVisible();
    });

    it("leaves the exception checkbox unchecked by default when not_recommended is selected", async () => {
      const user = userEvent.setup();
      const component = await AwardRecommendationSubmissionEditPage({
        params: pageParams,
      });
      render(component);

      const recommendationSelect = await screen.findByRole("combobox");
      await user.selectOptions(recommendationSelect, "not_recommended");

      const checkbox = screen.getByLabelText("hasExceptionLabel");
      expect(checkbox).not.toBeChecked();
      expect(
        screen.queryByTestId("exception-detail-textarea"),
      ).not.toBeInTheDocument();
    });

    it("renders cancel and save buttons in the hero", async () => {
      const component = await AwardRecommendationSubmissionEditPage({
        params: pageParams,
      });
      render(component);

      expect(await screen.findByText("heroButtons.cancel")).toBeVisible();
      expect(
        screen.getByRole("button", { name: "heroButtons.save" }),
      ).toBeVisible();
    });

    it("renders warning when application submission is not found", async () => {
      mockGetAwardRecommendationSubmission.mockResolvedValue(null);

      const component = await AwardRecommendationSubmissionEditPage({
        params: pageParams,
      });
      render(component);

      expect(
        await screen.findByText("awardRecommendationSubmissionFetchError"),
      ).toBeVisible();
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
        return AwardRecommendationSubmissionEditPage({
          params: pageParams,
        });
      });

      expect(mockRedirect).toHaveBeenCalledWith("/maintenance");
    });
  });
});
