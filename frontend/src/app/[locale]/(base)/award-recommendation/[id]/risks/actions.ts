"use server";

import {
  createAwardRecommendationRisk,
  updateAwardRecommendationRisk,
} from "src/services/fetch/fetchers/awardRecommendationFetcher";

export type CreateRiskActionResponse = {
  success?: boolean;
  errorMessage?: string;
  riskId?: string;
};

export type UpdateRiskActionResponse = {
  success?: boolean;
  errorMessage?: string;
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

export async function updateRiskAction(
  awardRecommendationId: string,
  riskId: string,
  riskData: {
    comment: string;
    award_recommendation_risk_type: string;
    award_recommendation_application_submission_ids: string[];
  },
): Promise<UpdateRiskActionResponse> {
  try {
    await updateAwardRecommendationRisk(
      awardRecommendationId,
      riskId,
      riskData,
    );

    return {
      success: true,
    };
  } catch (e) {
    const error = e as Error;
    console.error(
      `Error updating award recommendation risk - ${error.message} ${error.cause?.toString() || ""}`,
    );
    return {
      success: false,
      errorMessage: error.message || "Failed to update risk",
    };
  }
}
