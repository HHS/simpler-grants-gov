import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'
import { createSession, getSession } from 'src/services/auth/session'

export async function GET(request: NextRequest) {
    const currentSession = await getSession();
    if (currentSession) {
      return NextResponse.json({ currentSession: true, token: currentSession.token });
    }
    else {
      return NextResponse.json({ currentSession: false });
    }
}
