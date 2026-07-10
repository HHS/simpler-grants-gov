"use server";

import { updateAwardRecommendationSubmissionDetails } from "src/services/fetch/fetchers/awardRecommendationFetcher";
import {
  AwardRecommendationSubmissionDetailUpdate,
  AwardRecommendationType,
} from "src/types/awardRecommendationTypes";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";

export type AwardRecommendationActionResponse = {
  success?: boolean;
  errorMessage?: string;
  validationErrors?: Record<string, string[]>;
};

const exceptionEligibleRecommendationTypes: AwardRecommendationType[] = [
  "recommended_without_funding",
  "not_recommended",
];

function readStringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

function submissionFieldName(submissionId: string, field: string): string {
  return `award_recommendation_submissions[${submissionId}][${field}]`;
}

function parseRecommendedAmountForApi(value: string): string {
  if (!value) {
    return "0.00";
  }

  const numeric = value.replace(/[$,\s]/g, "");
  const amount = Number(numeric);

  if (Number.isNaN(amount)) {
    return value;
  }

  return amount.toFixed(2);
}

function buildSubmissionUpdate(
  formData: FormData,
  submissionId: string,
): AwardRecommendationSubmissionDetailUpdate {
  const recommendationType = readStringValue(
    formData.get(
      submissionFieldName(submissionId, "award_recommendation_type"),
    ),
  ) as AwardRecommendationType;
  const canHaveException =
    exceptionEligibleRecommendationTypes.includes(recommendationType);
  const hasException =
    canHaveException &&
    readStringValue(
      formData.get(submissionFieldName(submissionId, "has_exception")),
    ) === "on";
  const generalComment = readStringValue(
    formData.get(submissionFieldName(submissionId, "general_comment")),
  );
  const exceptionDetail = readStringValue(
    formData.get(submissionFieldName(submissionId, "exception_detail")),
  );

  return {
    award_recommendation_type: recommendationType,
    general_comment: generalComment || null,
    recommended_amount: parseRecommendedAmountForApi(
      readStringValue(
        formData.get(submissionFieldName(submissionId, "recommended_amount")),
      ),
    ),
    has_exception: hasException,
    exception_detail: hasException ? exceptionDetail || null : null,
  };
}

// eslint-disable-next-line @typescript-eslint/require-await
export async function saveAwardRecommendation(
  _formData: FormData,
): Promise<AwardRecommendationActionResponse> {
  try {
    // TODO: Implement save functionality when endpoint is available
    return {
      success: true,
    };
  } catch (e) {
    const error = e as Error;
    console.error(
      `Error saving award recommendation - ${error.message} ${error.cause?.toString() || ""}`,
    );
    return {
      errorMessage: error.message,
    };
  }
}

export async function saveAwardRecommendationSubmissionDetails(
  formData: FormData,
): Promise<void> {
  const awardRecommendationId = readStringValue(
    formData.get("award_recommendation_id"),
  );
  const submissionId = readStringValue(
    formData.get("award_recommendation_application_submission_id"),
  );

  try {
    await updateAwardRecommendationSubmissionDetails(awardRecommendationId, {
      [submissionId]: buildSubmissionUpdate(formData, submissionId),
    });
    redirect(`/award-recommendation/${awardRecommendationId}/edit`);
  } catch (e) {
    if (isRedirectError(e)) {
      throw e;
    }

    const error = e as Error;
    console.error(
      `Error saving award recommendation submission details - ${error.message} ${error.cause?.toString() || ""}`,
    );
    throw error;
  }
}

// eslint-disable-next-line @typescript-eslint/require-await
export async function submitAwardRecommendationForReview(
  _formData: FormData,
): Promise<AwardRecommendationActionResponse> {
  try {
    // TODO: Implement submit for review functionality when endpoint is available
    return {
      success: true,
    };
  } catch (e) {
    const error = e as Error;
    console.error(
      `Error submitting award recommendation - ${error.message} ${error.cause?.toString() || ""}`,
    );
    return {
      errorMessage: error.message,
    };
  }
}
