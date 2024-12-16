import "server-only";

import { JWTPayload, jwtVerify, SignJWT } from "jose";
import { environment } from "src/constants/environments";
import { SessionPayload, UserSession } from "src/services/auth/types";
import { encodeText } from "src/utils/generalUtils";

// note that cookies will be async in Next 15
import { cookies } from "next/headers";

const encodedKey = encodeText(environment.SESSION_SECRET);

// returns a new date 1 week from time of function call
export const newExpirationDate = () =>
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

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

// could try memoizing this function if it is a performance risk
export const getTokenFromCookie = async (
  cookie: string,
): Promise<UserSession> => {
  const decryptedSession = await decrypt(cookie);
  if (!decryptedSession) return null;
  const token = (decryptedSession.token as string) ?? null;
  if (!token) return null;
  return {
    token,
  };
};

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
  cookies().delete("session");
}
