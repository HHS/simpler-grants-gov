import {
  AwardRecommendationDetails,
  AwardRecommendationStatus,
} from "src/types/awardRecommendationTypes";
import { getConfiguredDayJs } from "src/utils/dateUtil";
import { fetchAwardRecommendation } from "./fetchers";

export const getAwardRecommendationDetails =
  async (
    id: string,
  ): Promise<AwardRecommendationDetails> => {
    
    const mockStatus: AwardRecommendationStatus = "draft";

    const mockDetails: AwardRecommendationDetails = {
      recordNumber: "AR-26-0002",
      datePrepared: getConfiguredDayJs()("2026-01-08").format("MM/DD/YYYY"),
      status: mockStatus,
    };

    // Kept async to match real fetchers; replace this with a real
    // network request once the backend endpoint exists.
    return await Promise.resolve(mockDetails);

    // TODO: Replace mock data above with this once the backend endpoint exists.
    // const response = await fetchAwardRecommendation({ subPath: id });
    // const responseBody = (await response.json()) as { data: AwardRecommendationDetails };

    // return responseBody.data;
  };
