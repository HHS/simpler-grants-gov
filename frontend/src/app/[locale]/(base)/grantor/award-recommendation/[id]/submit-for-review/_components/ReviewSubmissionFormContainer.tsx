"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Alert } from "@trussworks/react-uswds";
import { useTranslations } from "next-intl";

import {
  ReviewSubmissionForm,
  ReviewFormType,
  ReviewFormData,
} from "src/components/award-recommendation/ReviewSubmissionForm";
import { submitReviewForAwardRecommendation } from "src/app/[locale]/(base)/grantor/award-recommendation/[id]/submit-for-review/actions";
import { useClientFetch } from "src/hooks/useClientFetch";
import { UserPrivilegesResponse } from "src/types/userTypes";

interface ReviewSubmissionFormContainerProps {
  awardRecommendationId: string;
  expectedReviewerType?: string;
}

export const ReviewSubmissionFormContainer: React.FC<
  ReviewSubmissionFormContainerProps
> = ({ awardRecommendationId, expectedReviewerType }) => {
  const router = useRouter();
  const t = useTranslations("AwardRecommendation.reviewForm");
  const [formType, setFormType] = useState<ReviewFormType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { clientFetch } = useClientFetch("Error checking privileges");

  useEffect(() => {
    const determineFormType = async () => {
      try {
        // Get user session to retrieve user_id
        const sessionResponse = await fetch("/api/auth/session", { cache: "no-store" });
        if (!sessionResponse.ok) {
          setErrorMessage(
            t("errors.authFailed") || "Failed to authenticate user.",
          );
          setIsLoading(false);
          return;
        }

        const session = await sessionResponse.json();
        if (!session.user_id) {
          setErrorMessage(
            t("errors.authFailed") || "Failed to authenticate user.",
          );
          setIsLoading(false);
          return;
        }

        // Fetch user privileges
        const privilegesResponse = await clientFetch(
          `/api/user/privileges`,
          { method: "POST" }
        ) as { data: UserPrivilegesResponse };

        const userPrivileges = privilegesResponse.data;
        
        // Extract all privileges from agency roles
        const allPrivileges: string[] = [];
        userPrivileges.agency_users?.forEach((agencyUser) => {
          agencyUser.agency_user_roles.forEach((role) => {
            allPrivileges.push(...role.privileges);
          });
        });

        // Determine what form type the user should see based on their privileges
        let userFormType: ReviewFormType | null = null;
        if (allPrivileges.includes("fmo_reviewer")) {
          userFormType = "fmo_reviewer";
        } else if (
          allPrivileges.includes("pqc_reviewer") ||
          allPrivileges.includes("gms_reviewer") ||
          allPrivileges.includes("gmo_reviewer") ||
          allPrivileges.includes("final_award_rec_approver")
        ) {
          userFormType = "reviewer";
        } else if (
          allPrivileges.includes("update_award_recommendation") ||
          allPrivileges.includes("create_award_recommendation")
        ) {
          userFormType = "content_creator";
        }

        // Validate user has required privileges
        if (!userFormType) {
          setErrorMessage(
            t("errors.insufficientPrivileges") ||
              "You do not have the required privileges to review award recommendations.",
          );
          setFormType(null);
          return;
        }

        // TODO: When workflow endpoint is ready, replace this with actual workflow status check
        // For now, validate that user's privilege matches the expected reviewer type
        if (expectedReviewerType && expectedReviewerType !== userFormType) {
          setErrorMessage(
            t("errors.invalidReviewerType") ||
              "You do not have permission to review at this stage.",
          );
          setFormType(null);
        } else {
          setFormType(userFormType);
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

    determineFormType();
  }, [expectedReviewerType, t, clientFetch]);

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

  const handleCancel = () => {
    router.push(`/grantor/award-recommendation/${awardRecommendationId}/edit`);
  };

  if (isLoading) {
    return <div className="margin-top-4">{t("loading")}</div>;
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
