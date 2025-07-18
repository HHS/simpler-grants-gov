import { readError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { fetchUserWithMethod } from "src/services/fetch/fetchers/fetchers";

import { NextResponse } from "next/server";

export const getUserOrganizations = async () => {
  const currentSession = await getSession();
  if (currentSession) {
    try {
      const organizationsResponse = await fetchUserWithMethod("GET")({
        subPath: `${currentSession.user_id}/organizations`,
        additionalHeaders: {
          "X-SGG-TOKEN": currentSession.token,
        },
      });
      const responseBody = (await organizationsResponse.json()) as { data: [] };
      return NextResponse.json(responseBody.data);
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
