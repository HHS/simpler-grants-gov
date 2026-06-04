import { readError } from "src/errors";
import { listAwardRecommendationSubmissions as fetchSubmissions } from "src/services/fetch/fetchers/awardRecommendationFetcher";
import { PaginationRequestBody } from "src/types/search/searchRequestTypes";

import { NextRequest } from "next/server";

export async function listAwardRecommendationSubmissions(
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

    const submissions = await fetchSubmissions(id);

    const startIndex = (pagination.page_offset - 1) * pagination.page_size;
    const endIndex = startIndex + pagination.page_size;
    const paginatedSubmissions = submissions.slice(startIndex, endIndex);

    return Response.json({
      data: paginatedSubmissions,
      pagination_info: {
        total_pages: Math.ceil(submissions.length / pagination.page_size),
        total_records: submissions.length,
      },
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
