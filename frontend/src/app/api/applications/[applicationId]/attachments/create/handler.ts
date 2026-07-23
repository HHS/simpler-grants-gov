import { readError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { createApplicationAttachment } from "src/services/fetch/fetchers/applicationFetcher";

import { NextResponse } from "next/server";

export const createApplicationAttachmentHandler = async (
  req: Request,
  options: { params: Promise<{ applicationId: string }> },
) => {
  const params = options.params;
  const session = await getSession();

  if (!session || !session.token) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { applicationId } = await params;
  const { pending_file_id } = (await req.json()) as {
    pending_file_id: string;
  };

  let errorMessage: string = "";
  if (!pending_file_id) errorMessage = "Missing pending_file_id";
  else if (!applicationId) errorMessage = "Missing applicationId";
  if (errorMessage)
    return NextResponse.json({ error: errorMessage }, { status: 400 });

  try {
    const res = await createApplicationAttachment(
      applicationId,
      pending_file_id,
    );
    return NextResponse.json({ data: res.data });
  } catch (e) {
    const { status, message } = readError(e as Error, 500);
    return Response.json(
      {
        message: `Error failed to upload attachment: ${message}`,
      },
      { status },
    );
  }
};
