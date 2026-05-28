import { readError } from "src/errors";
import { getAwardRecommendationRisks } from "src/services/fetch/fetchers/awardRecommendationFetcher";
import { PaginationRequestBody } from "src/types/search/searchRequestTypes";

import { NextRequest } from "next/server";

export async function getRisksForAwardRecommendation(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { pagination } = (await request.json()) as {
    pagination: PaginationRequestBody;
  };

  try {
    if (!id) {
      throw new Error("Award recommendation ID is required");
    }
    if (!pagination) {
      throw new Error("Pagination information is required");
    }

    const { risks, paginationInfo } = await getAwardRecommendationRisks(
      id,
      pagination,
    );

    return Response.json({
      data: risks,
      pagination_info: paginationInfo,
    });
  } catch (e) {
    const { status, message } = readError(e as Error, 500);
    console.error(e);
    return Response.json(
      {
        message: `Error attempting to fetch award recommendation risks: ${message}`,
      },
      { status },
    );
  }
}
