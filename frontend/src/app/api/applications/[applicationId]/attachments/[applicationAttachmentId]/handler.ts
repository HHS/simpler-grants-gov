import { readError, UnauthorizedError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { deleteAttachment } from "src/services/fetch/fetchers/applicationFetcher";

import { NextResponse } from "next/server";

export const deleteAttachmentHandler = async (
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ applicationId: string; applicationAttachmentId: string }>;
  },
) => {
  const applicationId = (await params).applicationId;
  const applicationAttachmentId = (await params).applicationAttachmentId;

  try {
    const session = await getSession();
    if (!session || !session.token) {
      throw new UnauthorizedError("No active session to get saved opportunity");
    }
    await deleteAttachment(
      applicationId,
      applicationAttachmentId,
      session.token,
    );
    return NextResponse.json({
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
