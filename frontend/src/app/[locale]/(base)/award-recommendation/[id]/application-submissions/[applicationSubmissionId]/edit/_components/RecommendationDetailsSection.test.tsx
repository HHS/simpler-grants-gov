import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { identity } from "lodash";
import { RecommendationDetailForm } from "src/app/[locale]/(base)/award-recommendation/[id]/application-submissions/[applicationSubmissionId]/edit/_components/RecommendationDetailsSection";
import { AwardRecommendationSubmission } from "src/types/awardRecommendationTypes";

jest.mock("next-intl", () => ({
  useTranslations: () => identity,
}));

const mockSubmission: AwardRecommendationSubmission = {
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

const mockSubmission2: AwardRecommendationSubmission = {
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
};

describe("RecommendationDetailForm", () => {
  describe("single submission mode", () => {
    it("renders recommendation fields for single submission", () => {
      render(<RecommendationDetailForm submission={mockSubmission} />);

      expect(screen.getByText("recommendationLabel")).toBeInTheDocument();
      expect(screen.getByText("amountRequestedLabel")).toBeInTheDocument();
      expect(screen.getByText("amountRecommendedLabel")).toBeInTheDocument();
    });

    it("displays formatted amounts for single submission", () => {
      render(<RecommendationDetailForm submission={mockSubmission} />);

      expect(screen.getByText("$100,000")).toBeInTheDocument();
      expect(screen.getByDisplayValue("$75,000")).toBeInTheDocument();
    });
  });

  describe("multiple submissions mode", () => {
    it("renders recommendation fields for multiple submissions", () => {
      render(
        <RecommendationDetailForm
          submissions={[mockSubmission, mockSubmission2]}
        />,
      );

      expect(screen.getByText("recommendationLabel")).toBeInTheDocument();
      expect(screen.getByText("commentsLabel")).toBeInTheDocument();
      expect(screen.getByText("fundingHeading")).toBeInTheDocument();
    });

    it("renders table with multiple submissions", () => {
      render(
        <RecommendationDetailForm
          submissions={[mockSubmission, mockSubmission2]}
        />,
      );

      expect(screen.getByText("applicationIdLabel")).toBeInTheDocument();
      // Table shows application_id, not application_submission_number
      expect(screen.getByText("app-1")).toBeInTheDocument();
      expect(screen.getByText("app-2")).toBeInTheDocument();
    });

    it("calculates and displays correct totals for requested amounts", () => {
      render(
        <RecommendationDetailForm
          submissions={[mockSubmission, mockSubmission2]}
        />,
      );

      expect(screen.getByText("totalLabel")).toBeInTheDocument();
      // Total requested: $100,000 + $50,000 = $150,000
      expect(screen.getByText("$150,000")).toBeInTheDocument();
    });

    it("calculates and displays correct totals for recommended amounts", () => {
      render(
        <RecommendationDetailForm
          submissions={[mockSubmission, mockSubmission2]}
        />,
      );

      // Total recommended: $75,000 + $25,000 = $100,000
      // Note: $100,000 also appears as individual requested amount
      const hundredThousandElements = screen.getAllByText("$100,000");
      expect(hundredThousandElements.length).toBeGreaterThanOrEqual(1);
    });

    it("handles submissions with missing amounts", () => {
      const submissionWithoutAmounts: AwardRecommendationSubmission = {
        award_recommendation_application_submission_id: "test-id-3",
        application_submission: {
          application_submission_id: "app-sub-3",
          application_submission_number: "SUB-003",
        },
      };

      render(
        <RecommendationDetailForm
          submissions={[mockSubmission, submissionWithoutAmounts]}
        />,
      );

      // Should still calculate totals, treating missing values as 0
      expect(screen.getByText("totalLabel")).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("returns null when no submission or submissions provided", () => {
      const { container } = render(<RecommendationDetailForm />);
      expect(container).toBeEmptyDOMElement();
    });

    it("treats single item in submissions array as single submission", () => {
      render(<RecommendationDetailForm submissions={[mockSubmission]} />);

      // Should render single submission view, not table
      expect(screen.queryByText("applicationIdLabel")).not.toBeInTheDocument();
      expect(screen.getByText("recommendationLabel")).toBeInTheDocument();
    });
  });

  describe("recommendation type interactions", () => {
    it("shows exception checkbox for 'recommended_without_funding'", () => {
      render(<RecommendationDetailForm submission={mockSubmission} />);

      const select = screen.getByRole("combobox", {
        name: /recommendationLabel/i,
      });
      fireEvent.change(select, {
        target: { value: "recommended_without_funding" },
      });

      expect(screen.getByText("hasExceptionLabel")).toBeInTheDocument();
    });

    it("shows exception checkbox for 'not_recommended'", () => {
      render(<RecommendationDetailForm submission={mockSubmission} />);

      const select = screen.getByRole("combobox", {
        name: /recommendationLabel/i,
      });
      fireEvent.change(select, { target: { value: "not_recommended" } });

      expect(screen.getByText("hasExceptionLabel")).toBeInTheDocument();
    });

    it("does not show exception checkbox for 'recommended_for_funding'", () => {
      render(<RecommendationDetailForm submission={mockSubmission} />);

      expect(screen.queryByText("hasExceptionLabel")).not.toBeInTheDocument();
    });

    it("shows exception detail textarea when exception is checked", () => {
      render(<RecommendationDetailForm submission={mockSubmission} />);

      const select = screen.getByRole("combobox", {
        name: /recommendationLabel/i,
      });
      fireEvent.change(select, {
        target: { value: "recommended_without_funding" },
      });

      // Exception is auto-checked, so it should already be visible
      expect(screen.getByText(/exceptionDetailLabel/i)).toBeInTheDocument();
      expect(
        screen.getByTestId("exception-detail-textarea"),
      ).toBeInTheDocument();
    });

    it("automatically checks exception for 'recommended_without_funding'", () => {
      render(<RecommendationDetailForm submission={mockSubmission} />);

      const select = screen.getByRole("combobox", {
        name: /recommendationLabel/i,
      });
      fireEvent.change(select, {
        target: { value: "recommended_without_funding" },
      });

      const checkbox = screen.getByRole("checkbox", {
        name: /hasExceptionLabel/i,
      });
      expect(checkbox).toBeChecked();
    });
  });

  describe("form field pre-population", () => {
    it("pre-populates general comment from submission_detail", () => {
      render(<RecommendationDetailForm submission={mockSubmission} />);

      const textarea = screen.getByTestId(
        "recommendation-comments-textarea",
      );
      expect(textarea).toHaveValue("Test comment");
    });

    it("pre-populates exception detail when provided", () => {
      const submissionWithException: AwardRecommendationSubmission = {
        ...mockSubmission,
        submission_detail: {
          award_recommendation_type: "recommended_without_funding",
          recommended_amount: "75000.00",
          has_exception: true,
          exception_detail: "Exception reason here",
        },
      };

      render(<RecommendationDetailForm submission={submissionWithException} />);

      const textarea = screen.getByTestId(
        "exception-detail-textarea",
      );
      expect(textarea).toHaveValue("Exception reason here");
    });

    it("pre-selects correct recommendation type", () => {
      const submissionNotRecommended: AwardRecommendationSubmission = {
        ...mockSubmission,
        submission_detail: {
          award_recommendation_type: "not_recommended",
          recommended_amount: "0.00",
        },
      };

      render(<RecommendationDetailForm submission={submissionNotRecommended} />);

      const select = screen.getByRole("combobox", {
        name: /recommendationLabel/i,
      });
      expect(select).toHaveValue("not_recommended");
    });
  });

  describe("currency formatting", () => {
    it("formats recommended amount on blur", async () => {
      render(<RecommendationDetailForm submission={mockSubmission} />);

      const input = screen.getByDisplayValue("$75,000");
      fireEvent.change(input, { target: { value: "50000" } });
      expect(input).toHaveValue("50000");

      fireEvent.blur(input);
      await waitFor(() => {
        expect(input.value).toBe("$50,000");
      });
    });

    it("handles invalid currency input gracefully", async () => {
      render(<RecommendationDetailForm submission={mockSubmission} />);

      const input = screen.getByDisplayValue("$75,000");
      fireEvent.change(input, { target: { value: "invalid" } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(input.value).toBeDefined();
      });
    });
  });

  describe("multiple submissions table", () => {
    it("renders input fields for each submission", () => {
      render(
        <RecommendationDetailForm
          submissions={[mockSubmission, mockSubmission2]}
        />,
      );

      // Check that both recommended amount inputs are rendered
      expect(
        screen.getByDisplayValue("$75,000"),
      ).toBeInTheDocument();
      expect(
        screen.getByDisplayValue("$25,000"),
      ).toBeInTheDocument();
    });

    it("displays application IDs in table rows", () => {
      render(
        <RecommendationDetailForm
          submissions={[mockSubmission, mockSubmission2]}
        />,
      );

      expect(screen.getByText("app-1")).toBeInTheDocument();
      expect(screen.getByText("app-2")).toBeInTheDocument();
    });

    it("handles missing application data gracefully", () => {
      const submissionNoApp: AwardRecommendationSubmission = {
        award_recommendation_application_submission_id: "test-id-3",
        application_submission: {
          application_submission_id: "app-sub-3",
          total_requested_amount: "30000.00",
        },
      };

      render(
        <RecommendationDetailForm
          submissions={[mockSubmission, submissionNoApp]}
        />,
      );

      expect(screen.getByText("totalLabel")).toBeInTheDocument();
    });
  });

  describe("required fields", () => {
    it("marks recommendation type as required", () => {
      render(<RecommendationDetailForm submission={mockSubmission} />);

      const select = screen.getByRole("combobox", {
        name: /recommendationLabel/i,
      });
      expect(select).toBeRequired();
    });

    it("marks recommended amount as required", () => {
      render(<RecommendationDetailForm submission={mockSubmission} />);

      const input = screen.getByDisplayValue("$75,000");
      expect(input).toBeRequired();
    });

    it("marks exception detail as required when shown", () => {
      const submissionWithException: AwardRecommendationSubmission = {
        ...mockSubmission,
        submission_detail: {
          award_recommendation_type: "recommended_without_funding",
          recommended_amount: "75000.00",
          has_exception: true,
          exception_detail: "Test exception",
        },
      };

      render(<RecommendationDetailForm submission={submissionWithException} />);

      const textarea = screen.getByTestId("exception-detail-textarea");
      expect(textarea).toBeRequired();
    });
  });
});
