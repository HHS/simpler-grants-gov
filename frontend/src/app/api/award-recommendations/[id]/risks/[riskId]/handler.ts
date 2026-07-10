import { readError } from "src/errors";
import { deleteAwardRecommendationRisk } from "src/services/fetch/fetchers/awardRecommendationFetcher";

import { NextRequest } from "next/server";

export async function deleteRiskForAwardRecommendation(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; riskId: string }> },
) {
  const { id, riskId } = await params;

  try {
    if (!id) {
      throw new Error("Award recommendation ID is required");
    }
    if (!riskId) {
      throw new Error("Risk ID is required");
    }

    const result = await deleteAwardRecommendationRisk(id, riskId);

    return Response.json({
      message: result.message || "Risk deleted successfully",
      success: result.success,
    });
  } catch (e) {
    const { status, message } = readError(e as Error, 500);
    console.error(e);
    return Response.json(
      {
        message: `Error attempting to delete award recommendation risk: ${message}`,
      },
      { status },
    );
  }
}
