import { readError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { getUserPrivileges } from "src/services/fetch/fetchers/userFetcher";

import { NextResponse } from "next/server";

export const getUserPrivilegesHandler = async () => {
  const currentSession = await getSession();
  if (!currentSession) {
    return NextResponse.json(
      {
        message: "Not logged in, cannot retrieve user privileges",
      },
      { status: 401 },
    );
  }
  try {
    const privileges = await getUserPrivileges(currentSession.user_id);
    return NextResponse.json({ data: privileges });
  } catch (e) {
    const { status, message } = readError(e as Error, 500);
    return Response.json(
      {
        message: `Error attempting to fetch user privileges: ${message}`,
      },
      { status },
    );
  }
};
