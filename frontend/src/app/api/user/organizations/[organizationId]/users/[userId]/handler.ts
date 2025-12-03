import { readError } from "src/errors";
import {
  removeOrganizationUser,
  updateOrganizationUserRoles,
} from "src/services/fetch/fetchers/organizationsFetcher";

import { NextRequest, NextResponse } from "next/server";

export const removeOrganizationUserHandler = async (
  _request: NextRequest,
  options: { params: Promise<{ organizationId: string; userId: string }> },
) => {
  const { organizationId, userId } = await options.params;

  try {
    const removedUser = await removeOrganizationUser(organizationId, userId);
    return NextResponse.json({ data: removedUser });
  } catch (error) {
    const { status, message } = readError(error as Error, 500);
    return NextResponse.json({ message }, { status });
  }
};

export const updateOrganizationUserHandler = async (
  request: NextRequest,
  options: { params: Promise<{ organizationId: string; userId: string }> },
) => {
  const { organizationId, userId } = await options.params;
  const { role_ids } = (await request.json()) as {
    role_ids: string[];
  };

  try {
    const updatedUser = await updateOrganizationUserRoles(
      organizationId,
      userId,
      role_ids,
    );
    return NextResponse.json({ data: updatedUser });
  } catch (error) {
    const { status, message } = readError(error as Error, 500);
    return NextResponse.json({ message }, { status });
  }
};
