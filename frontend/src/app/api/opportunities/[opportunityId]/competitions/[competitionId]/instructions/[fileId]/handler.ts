import { readError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { deleteCompetitionInstructions } from "src/services/fetch/fetchers/grantorOpportunitiesFetcher";

import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _request: NextRequest,
  context: {
    params: Promise<{
      opportunityId: string;
      competitionId: string;
      fileId: string;
    }>;
  },
) {
  const {
    opportunityId,
    competitionId,
    fileId: competitionInstructionId,
  } = await context.params;

  if (!opportunityId) {
    return NextResponse.json(
      { error: "Opportunity ID is required" },
      { status: 400 },
    );
  }
  if (!competitionId) {
    return NextResponse.json(
      { error: "Competition ID is required" },
      { status: 400 },
    );
  }
  if (!competitionInstructionId) {
    return NextResponse.json(
      { error: "Competition Instruction ID is required" },
      { status: 400 },
    );
  }

  const currentSession = await getSession();
  if (!currentSession) {
    return NextResponse.json(
      { error: "Not logged in, cannot delete competition instructions file" },
      { status: 401 },
    );
  }

  try {
    const response = await deleteCompetitionInstructions(
      opportunityId,
      competitionId,
      competitionInstructionId,
    );

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error("Error deleting competition instructions file:", error);
    const { status, message, cause } = readError(error as Error, 500);

    return NextResponse.json(
      {
        error: message,
        errorType: cause?.type,
      },
      { status },
    );
  }
}
