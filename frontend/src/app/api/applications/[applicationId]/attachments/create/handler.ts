import { readError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { createApplicationAttachment } from "src/services/fetch/fetchers/applicationFetcher";

import { NextResponse } from "next/server";

// generic message returned for any upstream or internal failure
const GENERIC_FAILURE_MESSAGE = "Error failed to upload attachment";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/*
  pending_file_id arrives from the browser, so it is validated at runtime
  Anything that is not a nonblank UUID string (arrays,
  objects, numbers, null, whitespace, malformed uuids) is rejected.
*/
const parsePendingFileId = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return UUID_PATTERN.test(trimmed) ? trimmed : null;
};

export const createApplicationAttachmentHandler = async (
  req: Request,
  options: { params: Promise<{ applicationId: string }> },
) => {
  const session = await getSession();

  if (!session || !session.token) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const { applicationId } = await options.params;

  let body: unknown;
  try {
    body = (await req.json()) as unknown;
  } catch {
    return NextResponse.json(
      { message: "Malformed request body" },
      { status: 400 },
    );
  }

  const rawPendingFileId =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>).pending_file_id
      : undefined;
  const pendingFileId = parsePendingFileId(rawPendingFileId);

  if (!pendingFileId) {
    return NextResponse.json(
      { message: "Invalid pending_file_id" },
      { status: 400 },
    );
  }

  try {
    const res = await createApplicationAttachment(applicationId, pendingFileId);
    return NextResponse.json({ data: res.data });
  } catch (e) {
    const { status, message } = readError(e as Error, 500);
    // logged server side only
    console.error("Error creating application attachment", {
      applicationId,
      status,
      message,
    });
    return NextResponse.json({ message: GENERIC_FAILURE_MESSAGE }, { status });
  }
};
