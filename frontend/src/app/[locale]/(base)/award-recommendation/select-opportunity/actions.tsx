"use server";

import { AwardSelectionMethod } from "src/constants/awardRecommendation";
import { createAwardRecommendation } from "src/services/fetch/fetchers/awardRecommendationFetcher";

export const createAwardRecommendationAction = async (
  fundingOpportunityId: string,
) => {
  const awardRecommendation =
    // TODO - make the award selection method dynamic based on user input
    await createAwardRecommendation(
      fundingOpportunityId,
      AwardSelectionMethod.MERIT_REVIEW_RANKING_ONLY,
    );

  return {
    awardRecommendationId: awardRecommendation.award_recommendation_id,
  };
};
