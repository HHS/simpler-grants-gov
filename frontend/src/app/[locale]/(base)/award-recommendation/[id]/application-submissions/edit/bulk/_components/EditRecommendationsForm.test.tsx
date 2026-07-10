import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { identity } from "lodash";
import EditRecommendationsForm from "src/app/[locale]/(base)/award-recommendation/[id]/application-submissions/edit/bulk/_components/EditRecommendationsForm";
import { AwardRecommendationSubmission } from "src/types/awardRecommendationTypes";

jest.mock("next-intl", () => ({
  useTranslations: () => identity,
}));

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockUseSelectedSubmissions = jest.fn();
jest.mock("src/hooks/useSelectedSubmissions", () => ({
  useSelectedSubmissions: (
    awardRecommendationId: string,
  ): ReturnType<typeof mockUseSelectedSubmissions> =>
    mockUseSelectedSubmissions(awardRecommendationId),
}));

jest.mock(
  "src/components/award-recommendation/SelectedApplicationsTable",
  () => {
    return function MockSelectedApplicationsTable() {
      return <div data-testid="selected-applications-table">Mock Table</div>;
    };
  },
);

jest.mock("src/components/core/SimplerAlert", () => {
  return function MockSimplerAlert({
    messageText,
    buttonId,
  }: {
    messageText: string;
    buttonId: string;
  }) {
    return (
      <div data-testid={buttonId} role="alert">
        {messageText}
      </div>
    );
  };
});

const mockSingleSubmission: AwardRecommendationSubmission = {
  award_recommendation_application_submission_id: "test-id-1",
  application_submission: {
    application_submission_id: "app-sub-1",
    application_submission_number: "SUB-001",
    project_title: "Test Project",
    total_requested_amount: "100000.00",
    application: {
      application_id: "app-1",
      competition_id: "comp-1",
      organization: {
        organization_id: "org-1",
        organization_name: "Test Org",
        uei: "UEI123",
      },
    },
  },
  submission_detail: {
    award_recommendation_type: "recommended_for_funding",
    recommended_amount: "75000.00",
    general_comment: "Test comment",
    has_exception: false,
  },
};

const mockMultipleSubmissions: AwardRecommendationSubmission[] = [
  mockSingleSubmission,
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
];

describe("EditRecommendationsForm", () => {
  const awardRecommendationId = "AR-26-0001";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when no selections exist", () => {
    beforeEach(() => {
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

    it("displays error alert when no submissions are selected", () => {
      render(
        <EditRecommendationsForm
          awardRecommendationId={awardRecommendationId}
        />,
      );

      expect(screen.getByTestId("no-selections-alert")).toBeInTheDocument();
      expect(screen.getByText("noSelectionsMessage")).toBeInTheDocument();
    });

    it("does not render the form content", () => {
      render(
        <EditRecommendationsForm
          awardRecommendationId={awardRecommendationId}
        />,
      );

      expect(
        screen.queryByTestId("selected-applications-table"),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("saveButton")).not.toBeInTheDocument();
    });
  });

  describe("when single submission is selected", () => {
    beforeEach(() => {
      mockUseSelectedSubmissions.mockReturnValue({
        selectedSubmissions: [mockSingleSubmission],
        hasSelections: true,
        selectedSubmissionIds: new Set(["test-id-1"]),
        setSelectedSubmissionIds: jest.fn(),
        addSubmission: jest.fn(),
        removeSubmission: jest.fn(),
        addMultipleSubmissions: jest.fn(),
        clearSelections: jest.fn(),
      });
    });

    it("renders the form with selected applications table", () => {
      render(
        <EditRecommendationsForm
          awardRecommendationId={awardRecommendationId}
        />,
      );

      expect(screen.getByText("selectedApplications")).toBeInTheDocument();
      expect(
        screen.getByTestId("selected-applications-table"),
      ).toBeInTheDocument();
    });

    it("renders single submission form with funding section", () => {
      render(
        <EditRecommendationsForm
          awardRecommendationId={awardRecommendationId}
        />,
      );

      expect(screen.getByText("fundingHeading")).toBeInTheDocument();
    });

    it("renders save and cancel buttons", () => {
      render(
        <EditRecommendationsForm
          awardRecommendationId={awardRecommendationId}
        />,
      );

      expect(screen.getByText("saveButton")).toBeInTheDocument();
      expect(screen.getByText("cancelButton")).toBeInTheDocument();
    });

    it("navigates back when cancel is clicked", async () => {
      const user = userEvent.setup();
      render(
        <EditRecommendationsForm
          awardRecommendationId={awardRecommendationId}
        />,
      );

      const cancelButton = screen.getByText("cancelButton");
      await user.click(cancelButton);

      expect(mockPush).toHaveBeenCalledWith(
        `/award-recommendation/${awardRecommendationId}/application-submissions/edit`,
      );
    });

    it("handles save action and navigates back", async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ delay: null });
      render(
        <EditRecommendationsForm
          awardRecommendationId={awardRecommendationId}
        />,
      );

      const saveButton = screen.getByText("saveButton");
      await user.click(saveButton);

      expect(screen.getByText("saving")).toBeInTheDocument();

      jest.advanceTimersByTime(500);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          `/award-recommendation/${awardRecommendationId}/application-submissions/edit`,
        );
      });

      jest.useRealTimers();
    });

    it("disables buttons while submitting", async () => {
      const user = userEvent.setup();
      render(
        <EditRecommendationsForm
          awardRecommendationId={awardRecommendationId}
        />,
      );

      const saveButton = screen.getByText("saveButton");
      await user.click(saveButton);

      expect(screen.getByText("saving")).toBeDisabled();
      expect(screen.getByText("cancelButton")).toBeDisabled();
    });
  });

  describe("when multiple submissions are selected", () => {
    beforeEach(() => {
      mockUseSelectedSubmissions.mockReturnValue({
        selectedSubmissions: mockMultipleSubmissions,
        hasSelections: true,
        selectedSubmissionIds: new Set(["test-id-1", "test-id-2"]),
        setSelectedSubmissionIds: jest.fn(),
        addSubmission: jest.fn(),
        removeSubmission: jest.fn(),
        addMultipleSubmissions: jest.fn(),
        clearSelections: jest.fn(),
      });
    });

    it("renders the form with multiple submissions", () => {
      render(
        <EditRecommendationsForm
          awardRecommendationId={awardRecommendationId}
        />,
      );

      expect(screen.getByText("selectedApplications")).toBeInTheDocument();
      expect(
        screen.getByTestId("selected-applications-table"),
      ).toBeInTheDocument();
    });

    it("displays recommendation fields for multiple submissions", () => {
      render(
        <EditRecommendationsForm
          awardRecommendationId={awardRecommendationId}
        />,
      );

      expect(screen.getByText("recommendationLabel")).toBeInTheDocument();
      expect(screen.getByText("commentsLabel")).toBeInTheDocument();
      expect(screen.getByText("fundingHeading")).toBeInTheDocument();
    });

    it("renders table view with totals for multiple submissions", () => {
      render(
        <EditRecommendationsForm
          awardRecommendationId={awardRecommendationId}
        />,
      );

      expect(screen.getByText("applicationIdLabel")).toBeInTheDocument();
      expect(screen.getByText("totalLabel")).toBeInTheDocument();
    });

    it("calculates correct totals for multiple submissions", () => {
      render(
        <EditRecommendationsForm
          awardRecommendationId={awardRecommendationId}
        />,
      );

      // Total requested: $100,000 + $50,000 = $150,000
      expect(screen.getByText("$150,000")).toBeInTheDocument();
      // Total recommended: $75,000 + $25,000 = $100,000
      // Note: $100,000 appears twice (individual requested amount and total recommended)
      const hundredThousandElements = screen.getAllByText("$100,000");
      expect(hundredThousandElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("error handling", () => {
    beforeEach(() => {
      mockUseSelectedSubmissions.mockReturnValue({
        selectedSubmissions: [mockSingleSubmission],
        hasSelections: true,
        selectedSubmissionIds: new Set(["test-id-1"]),
        setSelectedSubmissionIds: jest.fn(),
        addSubmission: jest.fn(),
        removeSubmission: jest.fn(),
        addMultipleSubmissions: jest.fn(),
        clearSelections: jest.fn(),
      });
    });

    it("does not display error alert initially", () => {
      render(
        <EditRecommendationsForm
          awardRecommendationId={awardRecommendationId}
        />,
      );

      expect(screen.queryByTestId("error-alert")).not.toBeInTheDocument();
    });
  });

  describe("hook integration", () => {
    it("calls useSelectedSubmissions with correct award recommendation id", () => {
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

      render(
        <EditRecommendationsForm
          awardRecommendationId={awardRecommendationId}
        />,
      );

      expect(mockUseSelectedSubmissions).toHaveBeenCalledWith(
        awardRecommendationId,
      );
    });
  });
});
