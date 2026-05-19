import { readError, UnauthorizedError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { deleteAwardRecommendationRisk } from "src/services/fetch/fetchers/awardRecommendationFetcherClient";

import { NextRequest } from "next/server";

export async function deleteRiskForAwardRecommendation(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; riskId: string }> },
) {
  const { id, riskId } = await params;

  try {
    const session = await getSession();
    if (!session || !session.token) {
      throw new UnauthorizedError(
        "No active session to delete award recommendation risk",
      );
    }

    if (!id) {
      throw new Error("Award recommendation ID is required");
    }
    if (!riskId) {
      throw new Error("Risk ID is required");
    }

    const result = await deleteAwardRecommendationRisk(
      id,
      riskId,
      session.token,
    );

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
