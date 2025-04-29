import { getSession, refreshSession } from "src/services/auth/session";
import { isExpiring } from "src/utils/dateUtil";

import { NextResponse } from "next/server";

im;

export async function getUserSession(): Promise<NextResponse> {
  const currentSession = await getSession();
  if (currentSession) {
    if (isExpiring(currentSession.expiresAt)) {
      const refreshedSession = await refreshSession(currentSession.token);
      return NextResponse.json(refreshedSession);
    }
    return NextResponse.json(currentSession);
  } else {
    return NextResponse.json({ token: "" });
  }
}
