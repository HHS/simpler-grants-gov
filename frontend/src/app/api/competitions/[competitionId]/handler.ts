import { readError } from "src/errors";
import { getCompetitionDetails } from "src/services/fetch/fetchers/competitionsFetcher";

import { NextRequest } from "next/server";

export const getCompetition = async (
  _request: NextRequest,
  { params }: { params: Promise<{ competitionId: string }> },
): Promise<Response> => {
  const { competitionId } = await params;

  try {
    const competition = await getCompetitionDetails(competitionId);
    return new Response(JSON.stringify(competition), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    const { status, message } = readError(e as Error, 500);
    return Response.json(
      {
        message: `Error attempting to fetch saved searches: ${message}`,
      },
      { status },
    );
  }
};
