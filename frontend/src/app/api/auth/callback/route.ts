import { sessionManager } from "src/services/auth/session";

import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

const createSessionAndSetStatus = async (
  token: string,
  successStatus: string,
): Promise<string> => {
  try {
    await sessionManager.createSession(token);
    return successStatus;
  } catch (error) {
    console.error("error in creating session", error);
    return "error!";
  }
};

/*
  currently it looks like the API will send us a request with the params below, and we will be responsible
  for directing the user accordingly. For now, we'll send them to generic success and error pages with cookie set on success

    message: str ("success" or "error")
    token: str | None
    is_user_new: bool | None
    error_description: str | None

    TODOS:

    - translating messages?
    - ...
*/
export async function GET(request: NextRequest) {
  const currentSession = await sessionManager.getSession();
  if (currentSession && currentSession.token) {
    const status = await createSessionAndSetStatus(
      currentSession.token,
      "already logged in",
    );
    return redirect(`/user?message=${status}`);
  }
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return redirect("/user?message=no token provided");
  }
  const status = await createSessionAndSetStatus(token, "created session");
  return redirect(`/user?message=${status}`);
}
