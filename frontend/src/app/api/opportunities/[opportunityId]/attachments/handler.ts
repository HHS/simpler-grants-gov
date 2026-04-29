import { readError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { uploadOpportunityAttachment } from "src/services/fetch/fetchers/opportunityAttachmentFetcher";
import { createFormData } from "src/utils/fileUtils/createFormData";

import { NextResponse } from "next/server";

export const postOpportunityAttachmentHandler = async (
  req: Request,
  options: { params: Promise<{ opportunityId: string }> },
) => {
  const session = await getSession();

  if (!session || !session.token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { opportunityId } = await options.params;
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file || !opportunityId) {
    return NextResponse.json(
      { error: "Missing file or opportunityId" },
      { status: 400 },
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileFormData = createFormData(file.name, buffer, file.type);

  try {
    const res = await uploadOpportunityAttachment(opportunityId, fileFormData);
    return NextResponse.json({
      opportunity_attachment_id: res.data.opportunity_attachment_id,
    });
  } catch (e) {
    const { status, message } = readError(e as Error, 500);
    return Response.json(
      { message: `Error uploading attachment: ${message}` },
      { status },
    );
  }
};
