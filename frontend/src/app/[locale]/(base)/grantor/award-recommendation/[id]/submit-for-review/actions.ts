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
      ...(formData.contingent_date && {
        contingent_date: formData.contingent_date,
      }),
      ...(formData.supplemental_documents && {
        supplemental_document_ids: formData.supplemental_documents.map(
          (doc) => doc.id,
        ),
      }),
    };

    // TODO: INCOMPLETE - Backend API integration not implemented
    // This server action is a stub that returns success without making API calls
    // Required implementation:
    // 1. POST to /api/award-recommendations/{id}/reviews with workflowEventMetadata
    // 2. Handle workflow state transitions based on decision type
    // 3. Associate uploaded supplemental documents with the review submission
    // 4. Return actual API response with success/error from backend
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
