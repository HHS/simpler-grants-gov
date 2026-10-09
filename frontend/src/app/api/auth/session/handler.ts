import { getSession, refreshSession } from "src/services/auth/session";
import { logger } from "src/services/logger/simplerLogger";
import { isExpiring } from "src/utils/dateUtil";

import { NextResponse } from "next/server";

export async function getUserSession(): Promise<NextResponse> {
  const currentSession = await getSession();
  if (currentSession) {
    if (isExpiring(currentSession.expiresAt)) {
      try {
        const refreshedSession = await refreshSession(currentSession.token);
        return NextResponse.json(refreshedSession);
      } catch (e) {
        logger.error({ err: e }, "Unable to refresh expiring token");
      }
    }
    return NextResponse.json(currentSession);
  } else {
    return NextResponse.json({ token: "" });
  }
}
