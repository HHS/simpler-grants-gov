import { ApiRequestError, readError, UnauthorizedError } from "src/errors";
import { getSession } from "src/services/auth/session";
import { deleteSession } from "src/services/auth/sessionUtils";
import { postLogout } from "src/services/fetch/fetchers/userFetcher";

import { NextResponse } from "next/server";

export async function logoutUser() {
  try {
    const session = await getSession();
    if (!session || !session.token) {
      throw new UnauthorizedError("No active session to logout");
    }
    // logout on API via /v1/users/token/logout
    const response = await postLogout(session.token);
    if (!response) {
      throw new ApiRequestError("No logout response from API");
    }
    // delete session from current cookies
    await deleteSession();
    return NextResponse.json({ message: "logout success" });
  } catch (e) {
    const { message, status, cause } = readError(e as Error, 500);
    // if token expired, delete session and return 401
    if (status === 401 && cause?.message === "Token expired") {
      await deleteSession();
      return NextResponse.json(
        { message: "session previously expired" },
        { status },
      );
    } else {
      return NextResponse.json(
        { message: `Error logging out: ${message}` },
        { status },
      );
    }
  }
}
