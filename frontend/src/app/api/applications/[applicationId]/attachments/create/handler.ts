import { readError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { createApplicationAttachment } from "src/services/fetch/fetchers/applicationFetcher";

import { NextResponse } from "next/server";

export const createApplicationAttachmentHandler = async (
  req: Request,
  options: { params: Promise<{ applicationId: string }> },
) => {
  const session = await getSession();

  if (!session || !session.token) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const { applicationId } = await options.params;

  let pendingFileId: string | undefined;
  try {
    ({ pending_file_id: pendingFileId } = (await req.json()) as {
      pending_file_id?: string;
    });
  } catch {
    return NextResponse.json(
      { message: "Malformed request body" },
      { status: 400 },
    );
  }

  if (!pendingFileId) {
    return NextResponse.json(
      { message: "Missing pending_file_id" },
      { status: 400 },
    );
  }

  try {
    const res = await createApplicationAttachment(applicationId, pendingFileId);
    return NextResponse.json({ data: res.data });
  } catch (e) {
    const { status, message } = readError(e as Error, 500);
    return NextResponse.json(
      {
        message: `Error failed to upload attachment: ${message}`,
      },
      { status },
    );
  }
};
