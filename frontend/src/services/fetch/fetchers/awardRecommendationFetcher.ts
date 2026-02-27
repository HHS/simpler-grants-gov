import { AwardRecommendationDetails } from "src/types/awardRecommendationTypes";
import { mockAwardRecommendationDetails } from "src/utils/testing/fixtures";
import { fetchAwardRecommendation } from "./fetchers";

export const getAwardRecommendationDetails =
  async (
    id: string,
  ): Promise<AwardRecommendationDetails> => {
    // Kept async to match real fetchers; replace this with a real
    // network request once the backend endpoint exists.
    return await Promise.resolve(mockAwardRecommendationDetails);

    // TODO: Replace mock data above with this once the backend endpoint exists.
    // const response = await fetchAwardRecommendation({ subPath: id });
    // const responseBody = (await response.json()) as { data: AwardRecommendationDetails };

    // return responseBody.data;
  };
