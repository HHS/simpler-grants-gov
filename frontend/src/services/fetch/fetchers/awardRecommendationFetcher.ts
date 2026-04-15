import { AwardRecommendationDetails } from "src/types/awardRecommendationTypes";

import { fetchAwardRecommendation } from "./fetchers";

export const getAwardRecommendationDetails = async (
  id: string,
): Promise<AwardRecommendationDetails> => {
  const response = await fetchAwardRecommendation({ subPath: id });
  const responseBody = await response.json();
  const apiData = responseBody.data;

  return {
    ...apiData,
    award_recommendation_summary: apiData.award_recommendation_summary || {
      total_received_count: 200,
      recommended_for_funding_count: 150,
      recommended_without_funding_count: 25,
      not_recommended_count: 25,
      total_recommended_amount: 250000,
    },
  };
};
