"use server";

import {
  createAwardRecommendationRisk,
  updateAwardRecommendationRisk,
} from "src/services/fetch/fetchers/awardRecommendationFetcher";
import { logger } from "src/services/logger/simplerLogger";

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
    logger.error(
      { err: error, awardRecommendationId },
      "Error creating award recommendation risk",
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
    logger.error(
      { err: error, awardRecommendationId, riskId },
      "Error updating award recommendation risk",
    );
    return {
      success: false,
      errorMessage: error.message || "Failed to update risk",
    };
  }
}
