import { NextRequest, NextResponse } from "next/server";
import { getWorkflowDetails } from "src/services/fetch/fetchers/workflowFetcher";
import { readError } from "src/errors";
import { getSession } from "src/services/auth/session";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  
  if (!id) {
    return NextResponse.json(
      { error: "Workflow ID is required" },
      { status: 400 },
    );
  }

  const currentSession = await getSession();
  if (!currentSession) {
    return NextResponse.json(
      { error: "Not logged in, cannot retrieve workflow details" },
      { status: 401 },
    );
  }

  try {
    const workflowDetails = await getWorkflowDetails(id);

    return NextResponse.json({ data: workflowDetails });
  } catch (error) {
    console.error("Error fetching workflow details:", error);
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
