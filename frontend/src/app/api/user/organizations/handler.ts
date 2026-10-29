import { readError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { getUserOrganizations } from "src/services/fetch/fetchers/organizationsFetcher";

import { NextResponse } from "next/server";

export const getUserOrganizationsHandler = async () => {
  const currentSession = await getSession();
  if (!currentSession) {
    return NextResponse.json(
      {
        message: "Not logged in, cannot retrieve user organizations",
      },
      { status: 401 },
    );
  }
  try {
    const organizations = await getUserOrganizations(currentSession.user_id);
    return NextResponse.json(organizations);
  } catch (e) {
    const { status, message } = readError(e as Error, 500);
    return Response.json(
      {
        message: `Error attempting to fetch user organizations: ${message}`,
      },
      { status },
    );
  }
};
