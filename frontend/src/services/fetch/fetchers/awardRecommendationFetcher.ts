import {
  AwardRecommendationDetails,
  AwardRecommendationStatus,
} from "src/types/awardRecommendationTypes";
import { getConfiguredDayJs } from "src/utils/dateUtil";

export const getAwardRecommendationDetails =
  async (): Promise<AwardRecommendationDetails> => {
    // TODO: Replace with real API call when backend is available.
    const mockStatus: AwardRecommendationStatus = "draft";

    const mockDetails: AwardRecommendationDetails = {
      recordNumber: "AR-26-0002",
      datePrepared: getConfiguredDayJs()("2026-01-08").format("MM/DD/YYYY"),
      status: mockStatus,
    };

    // Kept async to match real fetchers; replace this with a real
    // network request once the backend endpoint exists.
    return await Promise.resolve(mockDetails);
  };
