import { NextRequest, NextResponse } from "next/server";
import { getWorkflowDetails } from "src/services/fetch/fetchers/workflowFetcher";
import { readError } from "src/errors";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    
    if (!id) {
      return NextResponse.json(
        { error: "Workflow ID is required" },
        { status: 400 },
      );
    }

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
