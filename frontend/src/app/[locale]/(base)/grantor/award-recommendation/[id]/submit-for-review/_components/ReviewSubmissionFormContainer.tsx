"use client";

import { submitReviewForAwardRecommendation } from "src/app/[locale]/(base)/grantor/award-recommendation/[id]/submit-for-review/actions";
import { useClientFetch } from "src/hooks/useClientFetch";
import { UserPrivilegesResponse } from "src/types/userTypes";
import { WorkflowState } from "src/types/workflowTypes";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert } from "@trussworks/react-uswds";

import {
  ReviewFormData,
  ReviewFormType,
  ReviewSubmissionForm,
} from "src/components/award-recommendation/ReviewSubmissionForm";
import Spinner from "src/components/core/Spinner";

interface ReviewSubmissionFormContainerProps {
  awardRecommendationId: string;
  reviewWorkflowId?: string;
}

// TODO: Form type determination needs improvement
// Current implementation defaults to "content_creator" for unknown states
// Should default to error state and only allow content_creator edit mode for specific roles
// All other users should be redirected to view-only mode instead of edit form
// Map workflow states to form types
const getFormTypeFromWorkflowState = (state: WorkflowState): ReviewFormType => {
  switch (state) {
    case "start":
    case "pending_revision_start":
      return "content_creator";
    case "pending_pqc_review":
    case "pending_gms_review_start":
    case "pending_gms_review":
    case "pending_gmo_review":
      return "reviewer";
    case "pending_fmo_review":
      return "fmo_reviewer";
    default:
      return "content_creator";
  }
};

// TODO: Access control needs refinement for edit vs view mode
// Currently all authorized users can access this submit-for-review page
// Should implement logic: only content creators can edit, all others redirect to view-only mode
// Non-content-creator users should be routed to detail page instead of edit form
export const ReviewSubmissionFormContainer: React.FC<
  ReviewSubmissionFormContainerProps
> = ({ awardRecommendationId, reviewWorkflowId }) => {
  const router = useRouter();
  const t = useTranslations("AwardRecommendation.reviewForm");
  const [formType, setFormType] = useState<ReviewFormType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { clientFetch } = useClientFetch("Error fetching workflow details");

  useEffect(() => {
    const determineFormType = async () => {
      try {
        // Step 1: Check user privileges for authorization
        const privilegesResponse = (await clientFetch(`/api/user/privileges`, {
          method: "POST",
        })) as { data: UserPrivilegesResponse };

        const userPrivileges = privilegesResponse.data;

        // Extract all privileges from agency roles
        const allPrivileges: string[] = [];
        userPrivileges.agency_users?.forEach((agencyUser) => {
          agencyUser.agency_user_roles.forEach((role) => {
            allPrivileges.push(...role.privileges);
          });
        });

        // Check if user has any review-related privileges
        const hasReviewPrivileges =
          allPrivileges.includes("view_award_recommendation") ||
          allPrivileges.includes("fmo_reviewer") ||
          allPrivileges.includes("pqc_reviewer") ||
          allPrivileges.includes("gms_reviewer") ||
          allPrivileges.includes("gmo_reviewer") ||
          allPrivileges.includes("update_award_recommendation") ||
          allPrivileges.includes("create_award_recommendation");

        if (!hasReviewPrivileges) {
          setErrorMessage(
            t("errors.insufficientPrivileges") ||
              "You do not have the required privileges to review award recommendations.",
          );
          setFormType(null);
          setIsLoading(false);
          return;
        }

        // Step 2: Check if review_workflow_id exists
        if (!reviewWorkflowId) {
          setErrorMessage(
            t("errors.noWorkflow") ||
              "No workflow associated with this award recommendation.",
          );
          setIsLoading(false);
          return;
        }

        // Step 3: Fetch workflow details to determine form type
        const workflowResponse = (await clientFetch(
          `/api/workflows/${reviewWorkflowId}`,
          { method: "GET" },
        )) as { data: { current_workflow_state: WorkflowState } };

        const currentWorkflowState =
          workflowResponse.data.current_workflow_state;

        // Step 4: Determine form type based on workflow state
        const determinedFormType =
          getFormTypeFromWorkflowState(currentWorkflowState);

        // Step 5: Validate user has privilege for the determined form type
        // TODO: Improve privilege validation logic to be more explicit
        // Consider defaulting to error state rather than allowing access when uncertain
        // Add specific error messages for each privilege failure scenario
        let hasRequiredPrivilege = false;
        if (determinedFormType === "fmo_reviewer") {
          hasRequiredPrivilege = allPrivileges.includes("fmo_reviewer");
        } else if (determinedFormType === "reviewer") {
          hasRequiredPrivilege =
            allPrivileges.includes("pqc_reviewer") ||
            allPrivileges.includes("gms_reviewer") ||
            allPrivileges.includes("gmo_reviewer");
        } else if (determinedFormType === "content_creator") {
          hasRequiredPrivilege =
            allPrivileges.includes("update_award_recommendation") ||
            allPrivileges.includes("create_award_recommendation");
        }

        if (!hasRequiredPrivilege) {
          setErrorMessage(
            t("errors.invalidReviewerType") ||
              "You do not have permission to review at this stage of the workflow.",
          );
          setFormType(null);
        } else {
          setFormType(determinedFormType);
        }
      } catch (error) {
        console.error("Error determining form type:", error);
        setErrorMessage(
          t("errors.loadingFailed") || "Failed to load review form.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void determineFormType();
  }, [reviewWorkflowId, t, clientFetch]);

  // TODO: Submit handler calls server action but full workflow integration incomplete
  // Needs backend API endpoints for review submission and workflow state transitions
  const handleSubmit = async (formData: ReviewFormData) => {
    setErrorMessage(null);
    try {
      const result = await submitReviewForAwardRecommendation(
        awardRecommendationId,
        formData,
      );

      if (result.success) {
        router.push(`/grantor/award-recommendation/${awardRecommendationId}`);
      } else if (result.errorMessage) {
        setErrorMessage(result.errorMessage);
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      setErrorMessage(t("errors.submitFailed"));
    }
  };

  // TODO: Cancel routing logic may need adjustment based on user role
  // Currently always routes to /edit page regardless of user privileges
  // Consider routing based on user's actual permissions (edit vs view)
  const handleCancel = () => {
    router.push(`/grantor/award-recommendation/${awardRecommendationId}/edit`);
  };

  if (isLoading) {
    return (
      <div className="display-flex flex-justify-center padding-y-4">
        <Spinner className="height-3 width-3" />
      </div>
    );
  }

  if (errorMessage || !formType) {
    return (
      <>
        <Alert type="error" headingLevel="h2" className="margin-bottom-3">
          {errorMessage || t("errors.loadingFailed")}
        </Alert>
        <button
          className="usa-button usa-button--outline"
          onClick={handleCancel}
        >
          {t("buttons.cancel")}
        </button>
      </>
    );
  }

  return (
    <>
      <ReviewSubmissionForm
        formType={formType}
        awardRecommendationId={awardRecommendationId}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </>
  );
};
