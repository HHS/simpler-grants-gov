import { environment } from "src/constants/environments";
import { getSession } from "src/services/auth/session";
import { setLogoutTokenCookie } from "src/services/auth/sessionUtils";

import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest): Promise<NextResponse> {
  if (!environment.AUTH_LOGOUT_URL) {
    return new NextResponse("AUTH_LOGOUT_URL not defined", { status: 500 });
  }
  const session = await getSession();
  if (!session?.token) {
    return new NextResponse("user token not present", { status: 500 });
  }
  await setLogoutTokenCookie(session.token);
  return redirect(environment.AUTH_LOGOUT_URL);
}
