// Client-safe fetchers for award recommendation

import { environment } from "src/constants/environments";
import { PaginationInfo } from "src/types/apiResponseTypes";
import { AwardRecommendationRisk } from "src/types/awardRecommendationTypes";
import { PaginationRequestBody } from "src/types/search/searchRequestTypes";

type ApiResponse<T> = {
  data: T;
  pagination_info?: PaginationInfo;
  message?: string;
};

export const getAwardRecommendationRisks = async (
  id: string,
  pagination: PaginationRequestBody,
  token: string,
): Promise<{
  risks: AwardRecommendationRisk[];
  paginationInfo: PaginationInfo | undefined;
}> => {
  const apiBase = environment.API_URL || "";
  const response = await fetch(
    `${apiBase}/alpha/award-recommendations/${id}/risks/list`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-SGG-Token": token,
      },
      body: JSON.stringify({ pagination }),
    },
  );
  const responseBody = (await response.json()) as ApiResponse<
    AwardRecommendationRisk[]
  >;
  return {
    risks: responseBody.data || [],
    paginationInfo: responseBody.pagination_info,
  };
};

export const deleteAwardRecommendationRisk = async (
  awardRecommendationId: string,
  riskId: string,
  token: string,
): Promise<{ success: boolean; message?: string }> => {
  const apiBase = environment.API_URL || "";
  const response = await fetch(
    `${apiBase}/alpha/award-recommendations/${awardRecommendationId}/risks/${riskId}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "X-SGG-Token": token,
      },
    },
  );
  const responseBody = (await response.json()) as ApiResponse<null>;
  return {
    success: response.ok,
    message: responseBody.message,
  };
};
