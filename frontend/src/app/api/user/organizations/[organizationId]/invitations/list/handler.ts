import { readError, UnauthorizedError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { getOrganizationPendingInvitations } from "src/services/fetch/fetchers/organizationsFetcher";

import { NextRequest, NextResponse } from "next/server";

export const getOrganizationPendingInvitationsHandler = async (
  _request: NextRequest,
  options: { params: Promise<{ organizationId: string }> },
) => {
  const session = await getSession();
  if (!session?.token) {
    throw new UnauthorizedError("Not authenticated");
  }

  const { organizationId } = await options.params;

  try {
    const invitations = await getOrganizationPendingInvitations(
      session.token,
      organizationId,
    );

    return NextResponse.json({ data: invitations }, { status: 200 });
  } catch (error) {
    const { status, message } = readError(error as Error, 500);
    return NextResponse.json({ message }, { status });
  }
};
