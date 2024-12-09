import 'server-only'

import { SignJWT, jwtVerify } from 'jose';
import { SessionPayload } from './types';
import { cookies } from 'next/headers';

const secretKey = process.env.SESSION_SECRET
const encodedKey = new TextEncoder().encode(secretKey)

export async function encrypt(payload: SessionPayload):Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey)
}

export async function decrypt(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload
  } catch (error) {
    console.log('Failed to verify session')
  }
}

export async function checkCookie(session: string | undefined = '') {
    const payload = await decrypt(session);
    // check payload?
    return true;
}

export async function createSession(token: string) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const session = await encrypt({ token, expiresAt });
    cookies().set(
      'session',
      session,
      {
        httpOnly: true,
        secure: true,
        expires: expiresAt,
        sameSite: 'lax',
        path: '/',
      }
    )
}

export async function checkApi() {

}

export async function updateSession() {
    const session = (cookies()).get('session')?.value
    const payload = await decrypt(session)

    if (!session || !payload) {
      return null
    }

    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const cookieStore = cookies()
    cookieStore.set('session', session, {
      httpOnly: true,
      secure: true,
      expires: expires,
      sameSite: 'lax',
      path: '/',
    })
  }

  export async function deleteSession() {
    const cookieStore = cookies()
    cookieStore.delete('session')
  }
