import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { identity } from "lodash";

import { ReviewSubmissionForm } from "./ReviewSubmissionForm";

jest.mock("next-intl", () => ({
  useTranslations: () => identity,
}));

jest.mock("src/components/core/fileInput/SimplerFileInput", () => ({
  SimplerFileInput: () => <div data-testid="file-input">File Input</div>,
}));

describe("ReviewSubmissionForm", () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  const defaultProps = {
    formType: "reviewer" as const,
    awardRecommendationId: "test-id-123",
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Content Creator Form", () => {
    it("renders content creator form without decision section", () => {
      render(
        <ReviewSubmissionForm {...defaultProps} formType="content_creator" />,
      );

      expect(
        screen.queryByText("reviewer.question"),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("fmo.question")).not.toBeInTheDocument();
      expect(screen.getByLabelText("reviewComment.label *")).toBeInTheDocument();
    });

    it("shows attestation text for content creator", () => {
      render(
        <ReviewSubmissionForm {...defaultProps} formType="content_creator" />,
      );

      expect(
        screen.getByText("attestation.contentCreator"),
      ).toBeInTheDocument();
    });
  });

  describe("Reviewer Form", () => {
    it("allows user to select a decision option", async () => {
      const user = userEvent.setup();
      render(<ReviewSubmissionForm {...defaultProps} formType="reviewer" />);

      const yesConcurRadio = screen.getByLabelText("reviewer.yesConcur");
      await user.click(yesConcurRadio);

      expect(yesConcurRadio).toBeChecked();
    });

    it("shows attestation text for reviewer", () => {
      render(<ReviewSubmissionForm {...defaultProps} formType="reviewer" />);

      expect(screen.getByText("attestation.reviewer")).toBeInTheDocument();
    });
  });

  describe("FMO Reviewer Form", () => {
    it("shows date input when contingent funds option is selected", async () => {
      const user = userEvent.setup();
      render(
        <ReviewSubmissionForm {...defaultProps} formType="fmo_reviewer" />,
      );

      expect(screen.queryByLabelText("fmo.dateLabel *")).not.toBeInTheDocument();

      const contingentRadio = screen.getByLabelText("fmo.fundsContingent");
      await user.click(contingentRadio);

      expect(screen.getByLabelText("fmo.dateLabel *")).toBeInTheDocument();
    });

    it("hides date input when a different option is selected", async () => {
      const user = userEvent.setup();
      render(
        <ReviewSubmissionForm {...defaultProps} formType="fmo_reviewer" />,
      );

      const contingentRadio = screen.getByLabelText("fmo.fundsContingent");
      await user.click(contingentRadio);
      expect(screen.getByLabelText("fmo.dateLabel *")).toBeInTheDocument();

      const fundsAvailableRadio = screen.getByLabelText("fmo.fundsAvailable");
      await user.click(fundsAvailableRadio);

      expect(screen.queryByLabelText("fmo.dateLabel *")).not.toBeInTheDocument();
    });
  });

  describe("Review Comments", () => {
    it("renders review comment textarea with character count", () => {
      render(<ReviewSubmissionForm {...defaultProps} />);

      expect(screen.getByLabelText("reviewComment.label *")).toBeInTheDocument();
      expect(screen.getByText("reviewComment.description")).toBeInTheDocument();
    });

    it("allows user to enter review comments", async () => {
      const user = userEvent.setup();
      render(<ReviewSubmissionForm {...defaultProps} />);

      const textarea = screen.getByLabelText("reviewComment.label *");
      await user.type(textarea, "This is a test review comment");

      expect(textarea).toHaveValue("This is a test review comment");
    });

    it("disables submit button when review comment is empty", () => {
      render(<ReviewSubmissionForm {...defaultProps} />);

      const submitButton = screen.getByRole("button", {
        name: "buttons.submit",
      });
      expect(submitButton).toBeDisabled();
    });

    it("enables submit button when review comment is filled", async () => {
      const user = userEvent.setup();
      render(<ReviewSubmissionForm {...defaultProps} />);

      const textarea = screen.getByLabelText("reviewComment.label *");
      await user.type(textarea, "Valid comment");

      const submitButton = screen.getByRole("button", {
        name: "buttons.submit",
      });
      expect(submitButton).toBeEnabled();
    });
  });

  describe("Internal Comments", () => {
    it("does not show internal comment textarea by default", () => {
      render(<ReviewSubmissionForm {...defaultProps} />);

      expect(
        screen.queryByLabelText("internalComment.label *"),
      ).not.toBeInTheDocument();
    });

    it("shows internal comment textarea when checkbox is checked", async () => {
      const user = userEvent.setup();
      render(<ReviewSubmissionForm {...defaultProps} />);

      const checkbox = screen.getByLabelText(
        "internalComment.checkboxLabel",
      );
      await user.click(checkbox);

      expect(screen.getByLabelText("internalComment.label *")).toBeInTheDocument();
      expect(
        screen.getByText("internalComment.description"),
      ).toBeInTheDocument();
    });

    it("hides internal comment textarea when checkbox is unchecked", async () => {
      const user = userEvent.setup();
      render(<ReviewSubmissionForm {...defaultProps} />);

      const checkbox = screen.getByLabelText(
        "internalComment.checkboxLabel",
      );
      await user.click(checkbox);
      expect(screen.getByLabelText("internalComment.label *")).toBeInTheDocument();

      await user.click(checkbox);
      expect(
        screen.queryByLabelText("internalComment.label *"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Supplemental Documents", () => {
    it("renders file input for supplemental documents", () => {
      render(<ReviewSubmissionForm {...defaultProps} />);

      expect(
        screen.getByText("supplementalDocuments.label"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("supplementalDocuments.description"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("file-input")).toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    it("calls onSubmit with form data when submitted", async () => {
      const user = userEvent.setup();
      render(<ReviewSubmissionForm {...defaultProps} formType="reviewer" />);

      const textarea = screen.getByLabelText("reviewComment.label *");
      await user.type(textarea, "Test review comment");

      const yesConcurRadio = screen.getByLabelText("reviewer.yesConcur");
      await user.click(yesConcurRadio);

      const submitButton = screen.getByRole("button", {
        name: "buttons.submit",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          review_comment: "Test review comment",
          internal_comment: undefined,
          has_internal_comment: false,
          decision: "yes_concur",
          contingent_date: undefined,
          supplemental_documents: undefined,
        });
      });
    });

    it("includes internal comment in submission when provided", async () => {
      const user = userEvent.setup();
      render(<ReviewSubmissionForm {...defaultProps} />);

      const reviewTextarea = screen.getByLabelText("reviewComment.label *");
      await user.type(reviewTextarea, "Public comment");

      const checkbox = screen.getByLabelText(
        "internalComment.checkboxLabel",
      );
      await user.click(checkbox);

      const internalTextarea = screen.getByLabelText(
        "internalComment.label *",
      );
      await user.type(internalTextarea, "Internal comment");

      const submitButton = screen.getByRole("button", {
        name: "buttons.submit",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            review_comment: "Public comment",
            internal_comment: "Internal comment",
            has_internal_comment: true,
          }),
        );
      });
    });

    it("includes contingent date for FMO reviewer when provided", async () => {
      const user = userEvent.setup();
      render(
        <ReviewSubmissionForm {...defaultProps} formType="fmo_reviewer" />,
      );

      const reviewTextarea = screen.getByLabelText("reviewComment.label *");
      await user.type(reviewTextarea, "FMO review");

      const contingentRadio = screen.getByLabelText("fmo.fundsContingent");
      await user.click(contingentRadio);

      const dateInput = screen.getByLabelText("fmo.dateLabel *");
      await user.type(dateInput, "2026-12-31");

      const submitButton = screen.getByRole("button", {
        name: "buttons.submit",
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            review_comment: "FMO review",
            decision: "funds_contingent",
            contingent_date: "2026-12-31",
          }),
        );
      });
    });

    it("shows submitting state while form is submitting", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      render(<ReviewSubmissionForm {...defaultProps} />);

      const textarea = screen.getByLabelText("reviewComment.label *");
      await user.type(textarea, "Test");

      const submitButton = screen.getByRole("button", {
        name: "buttons.submit",
      });
      await user.click(submitButton);

      expect(
        screen.getByRole("button", { name: "buttons.submitting" }),
      ).toBeInTheDocument();

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "buttons.submit" }),
        ).toBeInTheDocument();
      });
    });

    it("disables form buttons while submitting", async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      render(<ReviewSubmissionForm {...defaultProps} />);

      const textarea = screen.getByLabelText("reviewComment.label *");
      await user.type(textarea, "Test");

      const submitButton = screen.getByRole("button", {
        name: "buttons.submit",
      });
      const cancelButton = screen.getByRole("button", {
        name: "buttons.cancel",
      });

      await user.click(submitButton);

      expect(submitButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });
  });

  describe("Cancel Button", () => {
    it("calls onCancel when cancel button is clicked", async () => {
      const user = userEvent.setup();
      render(<ReviewSubmissionForm {...defaultProps} />);

      const cancelButton = screen.getByRole("button", {
        name: "buttons.cancel",
      });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it("does not call onSubmit when cancel is clicked", async () => {
      const user = userEvent.setup();
      render(<ReviewSubmissionForm {...defaultProps} />);

      const cancelButton = screen.getByRole("button", {
        name: "buttons.cancel",
      });
      await user.click(cancelButton);

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe("Form Styling", () => {
    it("applies custom styling to buttons", () => {
      render(<ReviewSubmissionForm {...defaultProps} />);

      const submitButton = screen.getByRole("button", {
        name: "buttons.submit",
      });
      const cancelButton = screen.getByRole("button", {
        name: "buttons.cancel",
      });

      expect(submitButton).toHaveClass("usa-button--compact");
      expect(cancelButton).toHaveClass("usa-button--compact");
    });
  });
});
