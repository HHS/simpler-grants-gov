import { readError } from "src/errors";
import { getSession } from "src/services/auth/session";
// import { fetchUserWithMethod } from "src/services/fetch/fetchers/fetchers";
// import { OrganizationInvitation } from "src/types/userTypes";
import { fakeOrganizationInvitation } from "src/utils/testing/fixtures";

import { NextResponse } from "next/server";

export const updateOrganizationInvitation = async (
  request: Request,
  // { params }: { params: Promise<{ organizationInvitationId: string }> },
) => {
  // const { organizationInvitationId } = await params;
  const currentSession = await getSession();
  if (currentSession) {
    try {
      const requestBody = (await request.json()) as { accepted: boolean };
      return NextResponse.json({
        ...fakeOrganizationInvitation,
        status: requestBody.accepted ? "accepted" : "rejected",
      });
      // const invitationResponse = await fetchUserWithMethod("POST")({
      //   subPath: `${currentSession.user_id}/invitations/${organizationInvitationId}`,
      //   additionalHeaders: {
      //     "X-SGG-TOKEN": currentSession.token,
      //   },
      //   body: {
      //     status: requestBody.status,
      //   },
      // });
      // const responseBody = (await invitationResponse.json()) as {
      //   data: OrganizationInvitation;
      // };
      // return NextResponse.json(responseBody.data);
    } catch (e) {
      const { status, message } = readError(e as Error, 500);
      return Response.json(
        {
          message: `Error attempting to fetch user organizations: ${message}`,
        },
        { status },
      );
    }
  }
  return NextResponse.json(
    {
      message: "Not logged in, cannot retrieve user organizations",
    },
    { status: 401 },
  );
};
