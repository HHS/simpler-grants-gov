import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { identity } from "lodash";
import { useRouter } from "next/navigation";
import * as useClientFetchModule from "src/hooks/useClientFetch";

import { ReviewSubmissionFormContainer } from "./ReviewSubmissionFormContainer";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("next-intl", () => ({
  useTranslations: () => identity,
}));

jest.mock("src/hooks/useClientFetch");
jest.mock(
  "src/components/award-recommendation/ReviewSubmissionForm",
  () => ({
    ReviewSubmissionForm: ({
      formType,
      onCancel,
      onSubmit,
    }: {
      formType: string;
      onCancel: () => void;
      onSubmit: (data: unknown) => void;
    }) => (
      <div>
        <div data-testid="form-type">{formType}</div>
        <button onClick={onCancel}>Cancel</button>
        <button onClick={() => onSubmit({ review_comment: "test" })}>
          Submit
        </button>
      </div>
    ),
  }),
);

jest.mock("src/components/core/Spinner", () => ({
  __esModule: true,
  default: () => <div data-testid="spinner">Loading</div>,
}));

jest.mock(
  "src/app/[locale]/(base)/grantor/award-recommendation/[id]/submit-for-review/actions",
  () => ({
    submitReviewForAwardRecommendation: jest.fn(),
  }),
);

const mockPush = jest.fn();

describe("ReviewSubmissionFormContainer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  const mockPrivilegesResponse = {
    data: {
      user_id: "user-123",
      organization_users: [],
      application_users: [],
      agency_users: [
        {
          agency: { agency_id: "agency-1" },
          agency_user_roles: [
            {
              role_id: "role-1",
              role_name: "Award Recommendation User",
              privileges: ["update_award_recommendation", "create_award_recommendation"],
            },
          ],
        },
      ],
    },
  };

  const mockWorkflowResponse = {
    data: {
      workflow_id: "workflow-123",
      current_workflow_state: "start",
    },
  };

  describe("Loading State", () => {
    it("shows spinner while loading", () => {
      const mockClientFetch = jest.fn();
      (useClientFetchModule.useClientFetch as jest.Mock).mockReturnValue({
        clientFetch: mockClientFetch,
      });
      mockClientFetch.mockResolvedValue(mockPrivilegesResponse);

      render(
        <ReviewSubmissionFormContainer
          awardRecommendationId="ar-123"
          reviewWorkflowId="workflow-123"
        />,
      );

      expect(screen.getByTestId("spinner")).toBeInTheDocument();
    });
  });

  describe("Content Creator Form", () => {
    it("renders content creator form when user has award recommendation privileges", async () => {
      const mockClientFetch = jest.fn();
      (useClientFetchModule.useClientFetch as jest.Mock).mockReturnValue({
        clientFetch: mockClientFetch,
      });
      mockClientFetch
        .mockResolvedValueOnce(mockPrivilegesResponse)
        .mockResolvedValueOnce(mockWorkflowResponse);

      render(
        <ReviewSubmissionFormContainer
          awardRecommendationId="ar-123"
          reviewWorkflowId="workflow-123"
        />,
      );

      await waitFor(() => {
        expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
      });

      expect(screen.getByTestId("form-type")).toHaveTextContent(
        "content_creator",
      );
    });
  });

  describe("FMO Reviewer Form", () => {
    it("renders fmo_reviewer form when workflow state is pending_fmo_review", async () => {
      const mockClientFetch = jest.fn();
      (useClientFetchModule.useClientFetch as jest.Mock).mockReturnValue({
        clientFetch: mockClientFetch,
      });
      
      const fmoPrivileges = {
        data: {
          ...mockPrivilegesResponse.data,
          agency_users: [
            {
              agency: { agency_id: "agency-1" },
              agency_user_roles: [
                {
                  role_id: "fmo-role",
                  role_name: "FMO Reviewer",
                  privileges: ["fmo_reviewer"],
                },
              ],
            },
          ],
        },
      };

      const fmoWorkflow = {
        data: {
          workflow_id: "workflow-123",
          current_workflow_state: "pending_fmo_review",
        },
      };

      mockClientFetch
        .mockResolvedValueOnce(fmoPrivileges)
        .mockResolvedValueOnce(fmoWorkflow);

      render(
        <ReviewSubmissionFormContainer
          awardRecommendationId="ar-123"
          reviewWorkflowId="workflow-123"
        />,
      );

      await waitFor(() => {
        expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
      });

      expect(screen.getByTestId("form-type")).toHaveTextContent("fmo_reviewer");
    });
  });

  describe("Reviewer Form", () => {
    it("renders reviewer form when workflow state is pending_pqc_review", async () => {
      const mockClientFetch = jest.fn();
      (useClientFetchModule.useClientFetch as jest.Mock).mockReturnValue({
        clientFetch: mockClientFetch,
      });
      
      const reviewerPrivileges = {
        data: {
          ...mockPrivilegesResponse.data,
          agency_users: [
            {
              agency: { agency_id: "agency-1" },
              agency_user_roles: [
                {
                  role_id: "reviewer-role",
                  role_name: "PQC Reviewer",
                  privileges: ["pqc_reviewer"],
                },
              ],
            },
          ],
        },
      };

      const reviewerWorkflow = {
        data: {
          workflow_id: "workflow-123",
          current_workflow_state: "pending_pqc_review",
        },
      };

      mockClientFetch
        .mockResolvedValueOnce(reviewerPrivileges)
        .mockResolvedValueOnce(reviewerWorkflow);

      render(
        <ReviewSubmissionFormContainer
          awardRecommendationId="ar-123"
          reviewWorkflowId="workflow-123"
        />,
      );

      await waitFor(() => {
        expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
      });

      expect(screen.getByTestId("form-type")).toHaveTextContent("reviewer");
    });
  });

  describe("Error Handling", () => {
    it("shows error when privileges fetch fails", async () => {
      const mockClientFetch = jest.fn();
      (useClientFetchModule.useClientFetch as jest.Mock).mockReturnValue({
        clientFetch: mockClientFetch,
      });
      mockClientFetch.mockRejectedValue(new Error("Fetch failed"));

      render(
        <ReviewSubmissionFormContainer
          awardRecommendationId="ar-123"
          reviewWorkflowId="workflow-123"
        />,
      );

      await waitFor(() => {
        expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
      });

      expect(screen.getByText("errors.loadingFailed")).toBeInTheDocument();
    });

    it("shows error when user has no privileges", async () => {
      const mockClientFetch = jest.fn();
      (useClientFetchModule.useClientFetch as jest.Mock).mockReturnValue({
        clientFetch: mockClientFetch,
      });
      
      const noPrivilegesResponse = {
        data: {
          user_id: "user-123",
          organization_users: [],
          application_users: [],
          agency_users: [],
        },
      };

      mockClientFetch.mockResolvedValueOnce(noPrivilegesResponse);

      render(
        <ReviewSubmissionFormContainer
          awardRecommendationId="ar-123"
          reviewWorkflowId="workflow-123"
        />,
      );

      await waitFor(() => {
        expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
      });

      expect(
        screen.getByText("errors.insufficientPrivileges"),
      ).toBeInTheDocument();
    });

    it("shows error when workflow ID is missing", async () => {
      const mockClientFetch = jest.fn();
      (useClientFetchModule.useClientFetch as jest.Mock).mockReturnValue({
        clientFetch: mockClientFetch,
      });
      mockClientFetch.mockResolvedValueOnce(mockPrivilegesResponse);

      render(
        <ReviewSubmissionFormContainer
          awardRecommendationId="ar-123"
          reviewWorkflowId={undefined}
        />,
      );

      await waitFor(() => {
        expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
      });

      expect(screen.getByText("errors.noWorkflow")).toBeInTheDocument();
    });

    it("shows error when user privilege doesn't match workflow stage", async () => {
      const mockClientFetch = jest.fn();
      (useClientFetchModule.useClientFetch as jest.Mock).mockReturnValue({
        clientFetch: mockClientFetch,
      });
      
      const contentCreatorPrivileges = {
        data: {
          ...mockPrivilegesResponse.data,
          agency_users: [
            {
              agency: { agency_id: "agency-1" },
              agency_user_roles: [
                {
                  role_id: "role-1",
                  role_name: "Award Recommendation User",
                  privileges: [
                    "update_award_recommendation",
                    "create_award_recommendation",
                  ],
                },
              ],
            },
          ],
        },
      };

      const fmoWorkflow = {
        data: {
          workflow_id: "workflow-123",
          current_workflow_state: "pending_fmo_review",
        },
      };

      mockClientFetch
        .mockResolvedValueOnce(contentCreatorPrivileges)
        .mockResolvedValueOnce(fmoWorkflow);

      render(
        <ReviewSubmissionFormContainer
          awardRecommendationId="ar-123"
          reviewWorkflowId="workflow-123"
        />,
      );

      await waitFor(() => {
        expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
      });

      expect(screen.getByText("errors.invalidReviewerType")).toBeInTheDocument();
    });

    it("shows error when workflow fetch fails", async () => {
      const mockClientFetch = jest.fn();
      (useClientFetchModule.useClientFetch as jest.Mock).mockReturnValue({
        clientFetch: mockClientFetch,
      });
      mockClientFetch
        .mockResolvedValueOnce(mockPrivilegesResponse)
        .mockRejectedValueOnce(new Error("Workflow fetch error"));

      render(
        <ReviewSubmissionFormContainer
          awardRecommendationId="ar-123"
          reviewWorkflowId="workflow-123"
        />,
      );

      await waitFor(() => {
        expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
      });

      expect(screen.getByText("errors.loadingFailed")).toBeInTheDocument();
    });
  });

  describe("Form Actions", () => {
    it("calls submit action and redirects on success", async () => {
      const mockClientFetch = jest.fn();
      (useClientFetchModule.useClientFetch as jest.Mock).mockReturnValue({
        clientFetch: mockClientFetch,
      });
      
      const {
        submitReviewForAwardRecommendation,
      } = require("src/app/[locale]/(base)/grantor/award-recommendation/[id]/submit-for-review/actions");
      submitReviewForAwardRecommendation.mockResolvedValue({ success: true });

      mockClientFetch
        .mockResolvedValueOnce(mockPrivilegesResponse)
        .mockResolvedValueOnce(mockWorkflowResponse);

      render(
        <ReviewSubmissionFormContainer
          awardRecommendationId="ar-123"
          reviewWorkflowId="workflow-123"
        />,
      );

      await waitFor(() => {
        expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
      });

      const submitButton = screen.getByText("Submit");
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(submitReviewForAwardRecommendation).toHaveBeenCalledWith(
          "ar-123",
          { review_comment: "test" },
        );
        expect(mockPush).toHaveBeenCalledWith("/grantor/award-recommendation/ar-123");
      });
    });

    it("shows error message when submit fails", async () => {
      const mockClientFetch = jest.fn();
      (useClientFetchModule.useClientFetch as jest.Mock).mockReturnValue({
        clientFetch: mockClientFetch,
      });
      
      const {
        submitReviewForAwardRecommendation,
      } = require("src/app/[locale]/(base)/grantor/award-recommendation/[id]/submit-for-review/actions");
      submitReviewForAwardRecommendation.mockResolvedValue({
        success: false,
        errorMessage: "Submit failed",
      });

      mockClientFetch
        .mockResolvedValueOnce(mockPrivilegesResponse)
        .mockResolvedValueOnce(mockWorkflowResponse);

      render(
        <ReviewSubmissionFormContainer
          awardRecommendationId="ar-123"
          reviewWorkflowId="workflow-123"
        />,
      );

      await waitFor(() => {
        expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
      });

      const submitButton = screen.getByText("Submit");
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Submit failed")).toBeInTheDocument();
      });
    });

    it("redirects to edit page when cancel is clicked", async () => {
      const mockClientFetch = jest.fn();
      (useClientFetchModule.useClientFetch as jest.Mock).mockReturnValue({
        clientFetch: mockClientFetch,
      });
      mockClientFetch
        .mockResolvedValueOnce(mockPrivilegesResponse)
        .mockResolvedValueOnce(mockWorkflowResponse);

      render(
        <ReviewSubmissionFormContainer
          awardRecommendationId="ar-123"
          reviewWorkflowId="workflow-123"
        />,
      );

      await waitFor(() => {
        expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
      });

      const cancelButton = screen.getByText("Cancel");
      await userEvent.click(cancelButton);

      expect(mockPush).toHaveBeenCalledWith(
        "/grantor/award-recommendation/ar-123/edit",
      );
    });
  });
});
