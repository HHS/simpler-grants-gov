import { readError, UnauthorizedError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { getOrganizationUsers } from "src/services/fetch/fetchers/organizationsFetcher";
import type { UserDetail } from "src/types/userTypes";

import { NextRequest, NextResponse } from "next/server";

export const getOrganizationUsersHandler = async (
  _request: NextRequest,
  options: { params: Promise<{ organizationId: string }> },
) => {
  const session = await getSession();
  if (!session?.token) {
    throw new UnauthorizedError("Not authenticated");
  }

  const { organizationId } = await options.params;

  try {
    const users: UserDetail[] = await getOrganizationUsers(
      session.token,
      organizationId,
    );
    return NextResponse.json({ data: users }, { status: 200 });
  } catch (error) {
    const { status, message } = readError(error as Error, 500);
    return NextResponse.json({ message }, { status });
  }
};
