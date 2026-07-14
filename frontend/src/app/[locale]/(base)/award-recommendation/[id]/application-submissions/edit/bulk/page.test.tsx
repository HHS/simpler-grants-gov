import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { identity } from "lodash";
import BulkEditRecommendationsPage from "src/app/[locale]/(base)/award-recommendation/[id]/application-submissions/edit/bulk/page";
import { AwardRecommendationDetails } from "src/types/awardRecommendationTypes";
import { LocalizedPageProps } from "src/types/intl";
import { FeatureFlaggedPageWrapper } from "src/types/uiTypes";
import { wrapForExpectedError } from "src/utils/testing/commonTestUtils";

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
  useRouter: () => ({
    push: jest.fn(),
  }),
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

const mockAwardRecommendationDetails: AwardRecommendationDetails = {
  award_recommendation_id: "AR-26-0001",
  award_recommendation_number: "AR-26-0001",
  award_recommendation_status: "draft",
  award_selection_method: "merit-review-only",
  opportunity: {
    opportunity_id: "opp-1",
    opportunity_number: "OPP-001",
    opportunity_title: "Test Opportunity",
    summary: {
      opportunity_status: "posted",
      summary_description: "Test description",
    },
  },
};

const mockGetAwardRecommendationDetails = jest
  .fn()
  .mockResolvedValue(mockAwardRecommendationDetails);

jest.mock("src/services/fetch/fetchers/awardRecommendationFetcher", () => ({
  getAwardRecommendationDetails: (
    awardRecommendationId: string,
  ): ReturnType<typeof mockGetAwardRecommendationDetails> =>
    mockGetAwardRecommendationDetails(awardRecommendationId),
}));

const mockUseSelectedSubmissions = jest.fn();
jest.mock("src/hooks/useSelectedSubmissions", () => ({
  useSelectedSubmissions: (
    awardRecommendationId: string,
  ): ReturnType<typeof mockUseSelectedSubmissions> =>
    mockUseSelectedSubmissions(awardRecommendationId),
}));

const pageParams = Promise.resolve({
  locale: "en",
  id: "AR-26-0001",
});

describe("BulkEditRecommendationsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSelectedSubmissions.mockReturnValue({
      selectedSubmissions: [],
      hasSelections: false,
      selectedSubmissionIds: new Set(),
      setSelectedSubmissionIds: jest.fn(),
      addSubmission: jest.fn(),
      removeSubmission: jest.fn(),
      addMultipleSubmissions: jest.fn(),
      clearSelections: jest.fn(),
    });
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

    it("fetches the award recommendation details", async () => {
      await BulkEditRecommendationsPage({
        params: pageParams,
        searchParams: Promise.resolve({}),
      });

      expect(mockGetAwardRecommendationDetails).toHaveBeenCalledWith(
        "AR-26-0001",
      );
    });

    it("renders the page with hero fallback", async () => {
      const component = await BulkEditRecommendationsPage({
        params: pageParams,
      });
      render(component);

      expect(
        await screen.findByTestId("award-recommendation-hero-fallback"),
      ).toBeInTheDocument();
    });

    it("renders the EditRecommendationsForm component", async () => {
      const component = await BulkEditRecommendationsPage({
        params: pageParams,
      });
      render(component);

      expect(
        await screen.findByText("noSelectionsMessage"),
      ).toBeInTheDocument();
    });

    it("displays error alert when award recommendation is not found", async () => {
      mockGetAwardRecommendationDetails.mockResolvedValue(null);

      const component = await BulkEditRecommendationsPage({
        params: pageParams,
      });
      render(component);

      expect(
        await screen.findByText("awardRecommendationNotFound"),
      ).toBeVisible();
    });

    it("displays authentication error on 401", async () => {
      mockGetAwardRecommendationDetails.mockRejectedValue({
        message: "Unauthorized",
        cause: { status: 401 },
      });

      const component = await BulkEditRecommendationsPage({
        params: pageParams,
      });
      render(component);

      expect(
        await screen.findByText("errorHeadingAuthentication"),
      ).toBeVisible();
      expect(screen.getByText("authenticationError")).toBeVisible();
    });

    it("displays authentication error on 403", async () => {
      mockGetAwardRecommendationDetails.mockRejectedValue({
        message: "Forbidden",
        cause: { status: 403 },
      });

      const component = await BulkEditRecommendationsPage({
        params: pageParams,
      });
      render(component);

      expect(
        await screen.findByText("errorHeadingAuthentication"),
      ).toBeVisible();
      expect(screen.getByText("authenticationError")).toBeVisible();
    });

    it("displays fetch error on other errors", async () => {
      mockGetAwardRecommendationDetails.mockRejectedValue({
        message: "Server error",
        cause: { status: 500 },
      });

      const component = await BulkEditRecommendationsPage({
        params: pageParams,
      });
      render(component);

      expect(
        await screen.findByText("errorHeadingAwardRecommendation"),
      ).toBeVisible();
      expect(screen.getByText("awardRecommendationFetchError")).toBeVisible();
    });

    describe("with single submission selected", () => {
      beforeEach(() => {
        mockUseSelectedSubmissions.mockReturnValue({
          selectedSubmissions: [
            {
              award_recommendation_application_submission_id: "test-id-1",
              application_submission: {
                application_submission_id: "app-sub-1",
                application_submission_number: "SUB-001",
                project_title: "Test Project",
                total_requested_amount: "100000.00",
                application: {
                  application_id: "app-1",
                  competition_id: "comp-1",
                },
              },
              submission_detail: {
                award_recommendation_type: "recommended_for_funding",
                recommended_amount: "75000.00",
              },
            },
          ],
          hasSelections: true,
          selectedSubmissionIds: new Set(["test-id-1"]),
          setSelectedSubmissionIds: jest.fn(),
          addSubmission: jest.fn(),
          removeSubmission: jest.fn(),
          addMultipleSubmissions: jest.fn(),
          clearSelections: jest.fn(),
        });
      });

      it("renders single submission form", async () => {
        const component = await BulkEditRecommendationsPage({
          params: pageParams,
        });
        render(component);

        expect(await screen.findByText("selectedApplications")).toBeVisible();
        expect(screen.getByText("recommendationLabel")).toBeVisible();
        expect(screen.getByText("fundingHeading")).toBeVisible();
      });

      it("does not show submission count for single selection", async () => {
        const component = await BulkEditRecommendationsPage({
          params: pageParams,
        });
        render(component);

        await screen.findByText("selectedApplications");
        expect(
          screen.queryByText(/submissionsSelected/),
        ).not.toBeInTheDocument();
      });
    });

    describe("with multiple submissions selected", () => {
      beforeEach(() => {
        mockUseSelectedSubmissions.mockReturnValue({
          selectedSubmissions: [
            {
              award_recommendation_application_submission_id: "test-id-1",
              application_submission: {
                application_submission_id: "app-sub-1",
                application_submission_number: "SUB-001",
                project_title: "Test Project",
                total_requested_amount: "100000.00",
                application: {
                  application_id: "app-1",
                  competition_id: "comp-1",
                },
              },
              submission_detail: {
                award_recommendation_type: "recommended_for_funding",
                recommended_amount: "75000.00",
              },
            },
            {
              award_recommendation_application_submission_id: "test-id-2",
              application_submission: {
                application_submission_id: "app-sub-2",
                application_submission_number: "SUB-002",
                project_title: "Test Project 2",
                total_requested_amount: "50000.00",
                application: {
                  application_id: "app-2",
                  competition_id: "comp-1",
                },
              },
              submission_detail: {
                award_recommendation_type: "recommended_for_funding",
                recommended_amount: "25000.00",
              },
            },
          ],
          hasSelections: true,
          selectedSubmissionIds: new Set(["test-id-1", "test-id-2"]),
          setSelectedSubmissionIds: jest.fn(),
          addSubmission: jest.fn(),
          removeSubmission: jest.fn(),
          addMultipleSubmissions: jest.fn(),
          clearSelections: jest.fn(),
        });
      });

      it("renders multiple submissions form with table", async () => {
        const component = await BulkEditRecommendationsPage({
          params: pageParams,
        });
        render(component);

        expect(await screen.findByText("selectedApplications")).toBeVisible();
        expect(screen.getByText("recommendationLabel")).toBeVisible();
        expect(screen.getByText("applicationIdLabel")).toBeVisible();
        expect(screen.getByText("totalLabel")).toBeVisible();
      });

      it("shows submission count for multiple selections", async () => {
        const component = await BulkEditRecommendationsPage({
          params: pageParams,
        });
        render(component);

        await screen.findByText("selectedApplications");
        expect(screen.getByText("2 submissionsSelected")).toBeVisible();
      });

      it("displays correct totals in funding table", async () => {
        const component = await BulkEditRecommendationsPage({
          params: pageParams,
        });
        render(component);

        await screen.findByText("totalLabel");
        expect(screen.getByText("$150,000")).toBeVisible();
        const hundredThousandElements = screen.getAllByText("$100,000");
        expect(hundredThousandElements.length).toBeGreaterThanOrEqual(1);
      });

      it("shows exception checkbox when recommended_without_funding is selected", async () => {
        const user = userEvent.setup();
        const component = await BulkEditRecommendationsPage({
          params: pageParams,
        });
        render(component);

        const recommendationSelect = await screen.findByRole("combobox");
        await user.selectOptions(
          recommendationSelect,
          "recommended_without_funding",
        );

        expect(screen.getByLabelText("hasExceptionLabel")).toBeVisible();
        expect(screen.getByLabelText("hasExceptionLabel")).toBeChecked();
      });

      it("shows exception detail textarea when checkbox is checked", async () => {
        const user = userEvent.setup();
        const component = await BulkEditRecommendationsPage({
          params: pageParams,
        });
        render(component);

        const recommendationSelect = await screen.findByRole("combobox");
        await user.selectOptions(recommendationSelect, "not_recommended");

        const checkbox = screen.getByLabelText("hasExceptionLabel");
        expect(checkbox).not.toBeChecked();

        await user.click(checkbox);

        expect(
          screen.getByTestId("exception-detail-textarea"),
        ).toBeInTheDocument();
      });
    });

    it("renders save and cancel buttons", async () => {
      mockUseSelectedSubmissions.mockReturnValue({
        selectedSubmissions: [
          {
            award_recommendation_application_submission_id: "test-id-1",
            application_submission: {
              application_submission_id: "app-sub-1",
              total_requested_amount: "100000.00",
            },
          },
        ],
        hasSelections: true,
        selectedSubmissionIds: new Set(["test-id-1"]),
        setSelectedSubmissionIds: jest.fn(),
        addSubmission: jest.fn(),
        removeSubmission: jest.fn(),
        addMultipleSubmissions: jest.fn(),
        clearSelections: jest.fn(),
      });

      const component = await BulkEditRecommendationsPage({
        params: pageParams,
      });
      render(component);

      expect(await screen.findByText("saveButton")).toBeVisible();
      expect(screen.getByText("cancelButton")).toBeVisible();
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
        return BulkEditRecommendationsPage({
          params: pageParams,
        });
      });

      expect(mockRedirect).toHaveBeenCalledWith("/maintenance");
    });
  });
});
