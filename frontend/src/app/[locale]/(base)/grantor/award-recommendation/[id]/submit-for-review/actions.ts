"use server";

import { ReviewFormData } from "src/components/award-recommendation/ReviewSubmissionForm";

export type ReviewActionResponse = {
  success?: boolean;
  errorMessage?: string;
};

// eslint-disable-next-line @typescript-eslint/require-await
export async function submitReviewForAwardRecommendation(
  awardRecommendationId: string,
  formData: ReviewFormData,
): Promise<ReviewActionResponse> {
  try {
    const workflowEventMetadata = {
      review_comment: formData.review_comment,
      ...(formData.has_internal_comment && {
        internal_comment: formData.internal_comment,
      }),
      ...(formData.decision && { decision: formData.decision }),
      ...(formData.contingent_date && { contingent_date: formData.contingent_date }),
      ...(formData.supplemental_documents && {
        supplemental_document_ids: formData.supplemental_documents.map((doc) => doc.id),
      }),
    };

    // TODO: Call backend API to submit review with workflowEventMetadata
    // Placeholder implementation - server action will make async API call
    void awardRecommendationId;
    void workflowEventMetadata;

    return Promise.resolve({
      success: true,
    });
  } catch (e) {
    const error = e as Error;
    console.error(
      `Error submitting review for award recommendation - ${error.message} ${error.cause?.toString() || ""}`,
    );
    return Promise.resolve({
      errorMessage: error.message,
    });
  }
}
