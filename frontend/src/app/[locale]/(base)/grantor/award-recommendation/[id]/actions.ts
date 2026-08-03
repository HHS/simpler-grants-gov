"use server";

import { AwardSelectionMethod } from "src/constants/awardRecommendation";
import {
  updateAwardRecommendation,
  updateAwardRecommendationSubmissionDetails,
} from "src/services/fetch/fetchers/awardRecommendationFetcher";
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

function nullableStringValue(value: FormDataEntryValue | null): string | null {
  return readStringValue(value) || null;
}

export async function saveAwardRecommendation(
  _previousState: AwardRecommendationActionResponse,
  formData: FormData,
): Promise<AwardRecommendationActionResponse> {
  const awardRecommendationId = readStringValue(
    formData.get("award_recommendation_id"),
  );

  try {
    await updateAwardRecommendation(awardRecommendationId, {
      award_selection_method: readStringValue(
        formData.get("award_selection_method"),
      ) as AwardSelectionMethod,
      additional_info: nullableStringValue(formData.get("additional_info")),
      funding_strategy: nullableStringValue(formData.get("funding_strategy")),
      selection_method_detail: nullableStringValue(
        formData.get("selection_method_detail"),
      ),
      other_key_information: nullableStringValue(
        formData.get("other_key_information"),
      ),
    });

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
    redirect(`/grantor/award-recommendation/${awardRecommendationId}/edit`);
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

export function submitAwardRecommendationForReview(
  formData: FormData,
): void {
  const awardRecommendationId = readStringValue(
    formData.get("award_recommendation_id"),
  );

  try {
    redirect(
      `/grantor/award-recommendation/${awardRecommendationId}/submit-for-review`,
    );
  } catch (e) {
    if (isRedirectError(e)) {
      throw e;
    }

    const error = e as Error;
    console.error(
      `Error navigating to submit review page - ${error.message} ${error.cause?.toString() || ""}`,
    );
    throw error;
  }
}
