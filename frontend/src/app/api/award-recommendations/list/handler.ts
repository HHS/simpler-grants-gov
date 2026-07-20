import { readError } from "src/errors";
import { listAwardRecommendationsPaginated } from "src/services/fetch/fetchers/awardRecommendationFetcher";
import { PaginationRequestBody } from "src/types/search/searchRequestTypes";

import { NextRequest } from "next/server";

export async function listAwardRecommendations(request: NextRequest) {
  const { pagination, agencyId } = (await request.json()) as {
    pagination: PaginationRequestBody;
    agencyId: string;
  };

  try {
    if (!pagination) {
      throw new Error("Pagination information is required");
    }
    if (!agencyId) {
      throw new Error("Agency ID is required");
    }

    const { awardRecommendations, paginationInfo } =
      await listAwardRecommendationsPaginated(agencyId, pagination);

    return Response.json({
      data: awardRecommendations,
      pagination_info: paginationInfo,
    });
  } catch (e) {
    const { status, message } = readError(e as Error, 500);
    return Response.json(
      {
        message: `Error attempting to fetch award recommendations: ${message}`,
      },
      { status },
    );
  }
}
