import { getSessionManager } from "src/services/auth/session";

import { NextResponse } from "next/server";

export async function GET() {
  const sessionManager = await getSessionManager();
  const currentSession = await sessionManager.getSession();
  if (currentSession) {
    return NextResponse.json({
      token: currentSession.token,
    });
  } else {
    return NextResponse.json({ token: "" });
  }
}
