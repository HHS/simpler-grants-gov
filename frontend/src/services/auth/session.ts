import 'server-only'

import { JWTPayload, SignJWT, jwtVerify } from 'jose';
import { SessionPayload, Session } from './types';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { date, number, unknown } from 'zod';
import { isEmpty } from 'lodash';

const secretKey = process.env.SESSION_SECRET
const encodedKey = new TextEncoder().encode(secretKey)

export async function encrypt(payload: SessionPayload):Promise<string> {
  const {token, expiresAt} = payload;
  return new SignJWT({token})
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(encodedKey)
}

export async function decrypt(session: string | undefined = ''):Promise<JWTPayload | null>  {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload;
  } catch (error) {
    console.debug('Failed to decrypt session', error);
    return null
  }
}

export const getSession = cache(async ():Promise<Session> => {
    const cookie = (await cookies()).get('session')?.value;
    if (!cookie) return null;
    const session = await decrypt(cookie);
    if (!session) return null;
    const token = session.token instanceof unknown ? null : session.token as string;
    if (!token) return null;
    return {
        token
    }
});

export async function createSession(token: string) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const session = await encrypt({ token, expiresAt });
    cookies().set(
      'session',
      session,
      {
        httpOnly: true,
        secure: true,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        sameSite: 'lax',
        path: '/',
      }
    );
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
