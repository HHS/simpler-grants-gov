import { APIResponse } from "src/types/apiResponseTypes";
import {
  AwardRecommendationDetails,
  AwardRecommendationSubmission,
} from "src/types/awardRecommendationTypes";

import {
  fetchAwardRecommendation,
  fetchAwardRecommendationWithMethod,
} from "./fetchers";

export const getAwardRecommendationDetails = async (
  id: string,
): Promise<AwardRecommendationDetails> => {
  const response = await fetchAwardRecommendation({ subPath: id });
  const responseBody = (await response.json()) as APIResponse;
  return responseBody.data as AwardRecommendationDetails;
};

export const listAwardRecommendationSubmissions = async (
  id: string,
): Promise<AwardRecommendationSubmission[]> => {
  const response = await fetchAwardRecommendationWithMethod("POST")({
    subPath: `${id}/submissions/list`,
    body: {
      pagination: {
        page_offset: 1,
        page_size: 100,
        sort_order: [
          {
            order_by: "application_submission_number",
            sort_direction: "ascending",
          },
        ],
      },
    },
  });
  const responseBody = (await response.json()) as APIResponse;

  return responseBody.data as AwardRecommendationSubmission[];
};

export const getAwardRecommendationSubmission = async (
  id: string,
  submissionId: string,
): Promise<AwardRecommendationSubmission | null> => {
  const submissions = await listAwardRecommendationSubmissions(id);

  return (
    submissions.find(
      (submission) =>
        submission.award_recommendation_application_submission_id ===
        submissionId,
    ) ?? null
  );
};
