import { getSession, refreshSession } from "src/services/auth/session";
import { isExpiring } from "src/utils/dateUtil";

import { NextResponse } from "next/server";

export const revalidate = 0;

export async function GET() {
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
