import { getSession, refreshSession } from "src/services/auth/session";
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
        console.error("Unable to refresh expiring token", e);
      }
    }
    return NextResponse.json(toUserProfile(currentSession));
  } else {
    return NextResponse.json(toUserProfile(null));
  }
}
