import { readError, UnauthorizedError } from "src/errors";
import { getSession } from "src/services/auth/session";
import {
  deleteOrganizationUser,
  updateOrganizationUserRoles,
} from "src/services/fetch/fetchers/organizationsFetcher";

import { NextRequest, NextResponse } from "next/server";

export const deleteOrganizationUserHandler = async (
  _request: NextRequest,
  options: { params: Promise<{ organizationId: string; userId: string }> },
) => {
  const session = await getSession();
  if (!session?.token) {
    throw new UnauthorizedError("Not authenticated");
  }

  const { organizationId, userId } = await options.params;

  try {
    const deletedUser = await deleteOrganizationUser(
      session.token,
      organizationId,
      userId,
    );
    return NextResponse.json({ data: deletedUser }, { status: 200 });
  } catch (error) {
    const { status, message } = readError(error as Error, 500);
    return NextResponse.json({ message }, { status });
  }
};

export const updateOrganizationUserHandler = async (
  request: NextRequest,
  options: { params: Promise<{ organizationId: string; userId: string }> },
) => {
  const session = await getSession();
  if (!session?.token) {
    throw new UnauthorizedError("Not authenticated");
  }
  const { organizationId, userId } = await options.params;
  const { role_ids } = (await request.json()) as {
    role_ids: string[];
  };

  try {
    const updatedUser = await updateOrganizationUserRoles(
      session.token,
      organizationId,
      userId,
      role_ids,
    );
    return NextResponse.json({ data: updatedUser }, { status: 200 });
  } catch (error) {
    const { status, message } = readError(error as Error, 500);
    return NextResponse.json({ message }, { status });
  }
};
