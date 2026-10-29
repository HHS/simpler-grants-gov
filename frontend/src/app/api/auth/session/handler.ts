import { readError } from "src/errors";
import { getSession, refreshSession } from "src/services/auth/session";
import { getCorrelationId } from "src/services/correlationId/correlationId";
import { logger } from "src/services/logger/simplerLogger";
import { UserProfile, UserSession } from "src/types/authTypes";
import { isExpiring } from "src/utils/dateUtil";

import { NextResponse } from "next/server";

// only expose what the browser needs to track session state, never the API token or PII
const toUserProfile = (session: UserSession | null): UserProfile =>
  session?.token
    ? { isLoggedIn: true, expiresAt: session.expiresAt }
    : { isLoggedIn: false };

export async function getUserSession(): Promise<NextResponse> {
  const currentSession = await getSession();
  if (currentSession) {
    if (isExpiring(currentSession.expiresAt)) {
      try {
        const refreshedSession = await refreshSession(currentSession.token);
        return NextResponse.json(toUserProfile(refreshedSession));
      } catch (e) {
        const { status } = readError(e as Error, 500);
        logger.error(
          {
            err: e,
            ...(status !== 401 &&
              status !== 403 && {
                event: "authentication_request_failed",
                correlation_id: await getCorrelationId(),
                authRequest: "session_refresh",
                status,
              }),
          },
          "Unable to refresh expiring token",
        );
      }
    }
    return NextResponse.json(toUserProfile(currentSession));
  } else {
    return NextResponse.json(toUserProfile(null));
  }
}
