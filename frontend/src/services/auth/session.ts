import "server-only";

import { JWTPayload, jwtVerify, SignJWT } from "jose";
import { environment } from "src/constants/environments";
import { SessionPayload, UserSession } from "src/services/auth/types";

// note that cookies will be async in Next 15
import { cookies } from "next/headers";
import { cache } from "react";

const encodedKey = new TextEncoder().encode(environment.SESSION_SECRET);

// returns a new date 1 week from time of function call
const newExpirationDate = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

export async function encrypt({
  token,
  expiresAt,
}: SessionPayload): Promise<string> {
  const jwt = await new SignJWT({ token })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(encodedKey);
  return jwt;
}

export async function decrypt(
  sessionCookie: string | undefined = "",
): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(sessionCookie, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error) {
    console.error("Failed to decrypt session cookie", error);
    return null;
  }
}

// is this cache doing anything? let's make sure
const getTokenFromCookie = cache(
  async (cookie: string): Promise<UserSession> => {
    const decryptedSession = await decrypt(cookie);
    if (!decryptedSession) return null;
    const token = (decryptedSession.token as string) ?? null;
    if (!token) return null;
    return {
      token,
    };
  },
);

// returns token decrypted from session cookie or null
export const getSession = async (): Promise<UserSession> => {
  const cookie = cookies().get("session")?.value;
  if (!cookie) return null;
  return getTokenFromCookie(cookie);
};

export async function createSession(token: string) {
  const expiresAt = newExpirationDate();
  const session = await encrypt({ token, expiresAt });
  cookies().set("session", session, {
    httpOnly: true,
    secure: true,
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

// currently unused, will be used in the future for logout
export function deleteSession() {
  const cookieStore = cookies();
  cookieStore.delete("session");
}
