import { readError } from "src/errors";
import { listAwardRecommendationSubmissionsPaginated } from "src/services/fetch/fetchers/awardRecommendationFetcher";
import { AwardRecommendationSubmissionListFilters } from "src/types/awardRecommendationTypes";
import { PaginationRequestBody } from "src/types/search/searchRequestTypes";

import { NextRequest } from "next/server";

export async function listAwardRecommendationSubmissions(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { pagination, filters } = (await request.json()) as {
    pagination: PaginationRequestBody;
    filters?: AwardRecommendationSubmissionListFilters;
  };

  try {
    if (!pagination) {
      throw new Error("Pagination information is required");
    }

    const { submissions, paginationInfo } =
      await listAwardRecommendationSubmissionsPaginated(
        id,
        pagination,
        filters,
      );

    return Response.json({
      data: submissions,
      pagination_info: paginationInfo,
    });
  } catch (e) {
    const { status, message } = readError(e as Error, 500);
    console.error(e);
    return Response.json(
      {
        message: `Error attempting to fetch award recommendation submissions: ${message}`,
      },
      { status },
    );
  }
}
