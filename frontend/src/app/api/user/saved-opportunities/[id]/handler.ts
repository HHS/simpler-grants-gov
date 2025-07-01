import { readError, UnauthorizedError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { getSavedOpportunity } from "src/services/fetch/fetchers/savedOpportunityFetcher";

import { NextResponse } from "next/server";

export async function getSavedOpportunityHandler(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const opportunityId = (await params).id;

  try {
    const session = await getSession();
    if (!session || !session.token) {
      throw new UnauthorizedError("No active session to get saved opportunity");
    }
    const savedOpportunities = await getSavedOpportunity(
      session.token,
      session.user_id,
      opportunityId,
    );
    return NextResponse.json(savedOpportunities, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    const { status, message } = readError(e as Error, 500);
    return NextResponse.json(
      {
        message: `Error fetching saved opportunity: ${message}`,
      },
      { status },
    );
  }
}
