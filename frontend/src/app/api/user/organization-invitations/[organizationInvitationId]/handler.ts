import { readError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { updateUserInvitation } from "src/services/fetch/fetchers/userFetcher";

import { NextResponse } from "next/server";

export const updateOrganizationInvitation = async (
  request: Request,
  { params }: { params: Promise<{ organizationInvitationId: string }> },
) => {
  const { organizationInvitationId } = await params;
  const currentSession = await getSession();
  if (!currentSession) {
    return NextResponse.json(
      {
        message: "Not logged in, cannot update organization invitation",
      },
      { status: 401 },
    );
  }
  try {
    const requestBody = (await request.json()) as { accepted: boolean };
    const invitation = await updateUserInvitation(
      currentSession.user_id,
      organizationInvitationId,
      requestBody.accepted ? "accepted" : "rejected",
    );
    return NextResponse.json(invitation);
  } catch (e) {
    const { status, message } = readError(e as Error, 500);
    return Response.json(
      {
        message: `Error attempting to update organization invitation: ${message}`,
      },
      { status },
    );
  }
};
