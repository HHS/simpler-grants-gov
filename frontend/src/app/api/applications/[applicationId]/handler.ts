import { readError, UnauthorizedError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { updateApplicationDetails } from "src/services/fetch/fetchers/applicationFetcher";

import { NextResponse } from "next/server";

export const updateApplicationDetailsHandler = async (
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) => {
  const formData = await request.formData();
  const applicationName = formData
    .get("application_name")
    ?.toString() as string;
  const applicationId = (await params).applicationId;

  try {
    const session = await getSession();
    if (!session?.token) {
      throw new UnauthorizedError("Session is not active");
    }

    const response = await updateApplicationDetails(
      applicationId,
      session.token,
      { application_name: applicationName },
    );

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const { status, message } = readError(error as Error, 500);
    return NextResponse.json({ message }, { status });
  }
};
