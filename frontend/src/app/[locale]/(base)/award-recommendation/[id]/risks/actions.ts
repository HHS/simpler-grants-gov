"use server";

import { createAwardRecommendationRisk } from "src/services/fetch/fetchers/awardRecommendationFetcher";

export type CreateRiskActionResponse = {
  success?: boolean;
  errorMessage?: string;
  riskId?: string;
};

export async function createRiskAction(
  awardRecommendationId: string,
  riskData: {
    comment: string;
    award_recommendation_risk_type: string;
    award_recommendation_application_submission_ids: string[];
  },
): Promise<CreateRiskActionResponse> {
  try {
    const result = await createAwardRecommendationRisk(
      awardRecommendationId,
      riskData,
    );

    return {
      success: true,
      riskId: result.award_recommendation_risk_id,
    };
  } catch (e) {
    const error = e as Error;
    console.error(
      `Error creating award recommendation risk - ${error.message} ${error.cause?.toString() || ""}`,
    );
    return {
      success: false,
      errorMessage: error.message || "Failed to create risk",
    };
  }
}
