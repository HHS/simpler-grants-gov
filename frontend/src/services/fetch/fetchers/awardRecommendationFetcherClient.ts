// Client-safe fetchers for award recommendation

import { environment } from "src/constants/environments";
import { PaginationInfo } from "src/types/apiResponseTypes";
import { PaginationRequestBody } from "src/types/search/searchRequestTypes";

export const getAwardRecommendationRisks = async (
  id: string,
  pagination: PaginationRequestBody,
  token: string,
): Promise<{ risks: any[]; paginationInfo: PaginationInfo | undefined }> => {
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
  const responseBody = await response.json();
  return {
    risks: responseBody.data || [],
    paginationInfo: responseBody.pagination_info,
  };
};
