import { readError, UnauthorizedError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { getApplicationDetails } from "src/services/fetch/fetchers/applicationFetcher";

import { NextResponse } from "next/server";

export const getApplicationDetailsHandler = async (
  _request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) => {
  const applicationId = (await params).applicationId;

  try {
    const session = await getSession();
    if (!session || !session.token) {
      throw new UnauthorizedError("No active session to get saved opportunity");
    }

    const response = await getApplicationDetails(applicationId, session.token);
    const attachments = response.data.application_attachments;

    return NextResponse.json(attachments, {
      status: 200,
    });
  } catch (error) {
    const { status, message } = readError(error as Error, 500);
    return NextResponse.json(
      {
        message: `${message}`,
      },
      { status },
    );
  }
};
