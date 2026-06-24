"use server";

import { createAwardRecommendation } from "src/services/fetch/fetchers/awardRecommendationFetcher";

export const createAwardRecommendationAction = async (
  fundingOpportunityId: string,
) => {
  const awardRecommendation =
    await createAwardRecommendation(fundingOpportunityId);

  return {
    awardRecommendationId: awardRecommendation.award_recommendation_id,
  };
};