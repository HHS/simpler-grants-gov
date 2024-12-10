import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'
import { createSession, getSession } from 'src/services/auth/session'

export async function GET(request: NextRequest) {
    const currentSession = await getSession();
    let status = ''
    if (currentSession) {
      status = "already logged in.";
      // return NextResponse.redirect(new URL('/', request.nextUrl.origin), 307);
      return new Response(status, {
        status: 200,
      })
    }
    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
      status = "no token provided"
      // return NextResponse.redirect(new URL('/', request.nextUrl.origin), 307);
      return new Response(status, {
        status: 200,
      })
    }
    try {
      await createSession(token);
      status = "created session"
      // return NextResponse.redirect(new URL('/', request.nextUrl.origin), 307)
    }
    catch (error) {
      status = 'error!'
      console.debug("error in creating session", error);
    }
    return new Response(status, {
      status: 200,
    })

}
