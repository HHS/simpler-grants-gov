import { getSession } from "src/services/auth/session";
import { uploadAttachment } from "src/services/fetch/fetchers/applicationFetcher";
import { createFormData } from "src/utils/fileUtils/createFormData";

import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { applicationId: string } },
) {
  const session = await getSession();

  if (!session || !session.token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const applicationId = params.applicationId;
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
    if (res.status_code !== 200) throw new Error("Upload failed");

    return NextResponse.json({
      application_attachment_id: res.data?.application_attachment_id,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
