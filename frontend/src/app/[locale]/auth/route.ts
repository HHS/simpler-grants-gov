import { cookies } from 'next/headers'
import { type NextRequest } from 'next/server'
import { validateToken } from 'src/services/auth/utils';

export const dynamic = 'force-static'

export async function GET(request: NextRequest) {
    // 1. get token from URL params
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token') as string;
    // 2. validate token
    if (await validateToken(token)) {
        // 3. encrypt cookie

    }


    // return new Response.redirect(new URL('/dashboard', req.nextUrl))


    return new Response('Hello, Next.js!', {
      status: 200,
      headers: { 'Set-Cookie': `token=${token}` },
    })

}
