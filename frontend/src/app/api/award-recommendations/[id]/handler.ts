import { readError } from "src/errors";
import { deleteAwardRecommendation } from "src/services/fetch/fetchers/awardRecommendationFetcher";

import { NextRequest } from "next/server";

export async function deleteAwardRecommendationById(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    if (!id) {
      throw new Error("Award recommendation ID is required");
    }

    const result = await deleteAwardRecommendation(id);

    return Response.json({
      message: result.message || "Award recommendation deleted successfully",
      success: result.success,
    });
  } catch (e) {
    const { status, message } = readError(e as Error, 500);
    return Response.json(
      {
        message: `Error attempting to delete award recommendation: ${message}`,
      },
      { status },
    );
  }
}
