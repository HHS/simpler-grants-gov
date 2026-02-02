import { readError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { uploadAttachment } from "src/services/fetch/fetchers/applicationFetcher";
import { createFormData } from "src/utils/fileUtils/createFormData";

import { NextResponse } from "next/server";

export const postAttachmentHandler = async (
  req: Request,
  options: { params: Promise<{ applicationId: string }> },
) => {
  const params = options.params;
  const session = await getSession();

  if (!session || !session.token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { applicationId } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file || !applicationId) {
    return NextResponse.json(
      { error: "Missing file or applicationId" },
      { status: 400 },
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const fileFormData = createFormData(file.name, buffer, file.type);

  try {
    const res = await uploadAttachment(
      applicationId,
      session.token,
      fileFormData,
    );

    return NextResponse.json({
      application_attachment_id: res.data?.application_attachment_id,
    });
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
