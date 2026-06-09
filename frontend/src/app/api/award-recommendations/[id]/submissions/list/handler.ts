import { readError } from "src/errors";
import { fetchAwardRecommendationWithMethod } from "src/services/fetch/fetchers/fetchers";
import { APIResponse } from "src/types/apiResponseTypes";
import { PaginationRequestBody } from "src/types/search/searchRequestTypes";

import { NextRequest } from "next/server";

export async function listAwardRecommendationSubmissions(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const requestBody = (await request.json()) as {
    pagination: PaginationRequestBody;
    filters?: unknown;
  };

  try {
    if (!id) {
      throw new Error("Award recommendation ID is required");
    }
    if (!requestBody.pagination) {
      throw new Error("Pagination information is required");
    }

    const response = await fetchAwardRecommendationWithMethod("POST")({
      subPath: `${id}/submissions/list`,
      body: requestBody,
    });
    const responseBody = (await response.json()) as APIResponse;

    return Response.json(responseBody);
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
