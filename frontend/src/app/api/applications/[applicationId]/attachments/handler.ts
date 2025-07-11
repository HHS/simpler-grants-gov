import { readError, UnauthorizedError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { uploadAttachment } from "src/services/fetch/fetchers/applicationFetcher";

import { NextResponse } from "next/server";

function createFormData(filename: string, buffer: Buffer, mimeType: string) {
  const form = new FormData();
  const file = new File([buffer], filename, { type: mimeType });
  form.append("file_attachment", file);
  return form;
}

export const postAttachmentHandler = async (
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) => {
  const applicationId = (await params).applicationId;
  const formData = await request.formData();
  const file = formData.get("file_attachment") as File;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    const session = await getSession();
    if (!session || !session.token) {
      throw new UnauthorizedError("No active session post an attachment");
    }

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    await uploadAttachment(
      applicationId,
      session.token,
      createFormData(file.name, buffer, file.type),
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
