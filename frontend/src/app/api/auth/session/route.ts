import { getSession } from "src/services/auth/session";

import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  const currentSession = await getSession();
  if (currentSession) {
    return NextResponse.json({
      currentSession: true,
      token: currentSession.token,
    });
  } else {
    return NextResponse.json({ currentSession: false });
  }
}
