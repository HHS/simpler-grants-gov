import { readError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { addOrganizationToApplication } from "src/services/fetch/fetchers/addOrganizationToApplication";

import { NextResponse } from "next/server";

type TransferOwnershipRequestBody = {
  organization_id?: string;
};

export const transferOwnershipHandler = async (
  request: Request,
  options: { params: Promise<{ applicationId: string }> },
): Promise<Response> => {
  try {
    const session = await getSession();
    if (!session?.token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { applicationId } = await options.params;

    let parsedBody: TransferOwnershipRequestBody;
    try {
      parsedBody = (await request.json()) as TransferOwnershipRequestBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const organizationId = parsedBody.organization_id;

    if (!applicationId || !organizationId) {
      return NextResponse.json(
        { error: "Missing applicationId or organization_id" },
        { status: 400 },
      );
    }

    const responseBody = await addOrganizationToApplication({
      applicationId,
      organizationId,
    });

    return NextResponse.json(responseBody, { status: 200 });
  } catch (error: unknown) {
    const { status, message } = readError(error as Error, 500);
    return NextResponse.json(
      { message: `Error transferring application ownership: ${message}` },
      { status },
    );
  }
};
