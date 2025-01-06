import "server-only";

import { createPublicKey } from "crypto";
import { environment } from "src/constants/environments";
import {
  API_JWT_ENCRYPTION_ALGORITHM,
  CLIENT_JWT_ENCRYPTION_ALGORITHM,
  decrypt,
  encrypt,
  newExpirationDate,
} from "src/services/auth/sessionUtils";
import { SimplerJwtPayload, UserSession } from "src/services/auth/types";
import { encodeText } from "src/utils/generalUtils";

// note that cookies will be async in Next 15
import { cookies } from "next/headers";

// creates a Uint8Array
const clientJwtKey = encodeText(environment.SESSION_SECRET);

// creates a KeyObject
const loginGovJwtKey = createPublicKey(environment.API_JWT_PUBLIC_KEY);

const decryptClientToken = async (
  jwt: string,
): Promise<SimplerJwtPayload | null> => {
  const payload = await decrypt(
    jwt,
    clientJwtKey,
    CLIENT_JWT_ENCRYPTION_ALGORITHM,
  );
  if (!payload || !payload.token) return null;
  return payload as SimplerJwtPayload;
};

const decryptLoginGovToken = async (
  jwt: string,
): Promise<UserSession | null> => {
  const payload = await decrypt(
    jwt,
    loginGovJwtKey,
    API_JWT_ENCRYPTION_ALGORITHM,
  );
  return (payload as UserSession) ?? null;
};

// sets client token on cookie
export const createSession = async (token: string) => {
  const expiresAt = newExpirationDate();
  const session = await encrypt(token, expiresAt, clientJwtKey);
  cookies().set("session", session, {
    httpOnly: true,
    secure: true,
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
};

// returns the necessary user info from decrypted login gov token
// plus client token and expiration
export const getSession = async (): Promise<UserSession | null> => {
  const cookie = cookies().get("session")?.value;
  if (!cookie) return null;
  const payload = await decryptClientToken(cookie);
  if (!payload) {
    return null;
  }
  const { token, exp } = payload;
  const session = await decryptLoginGovToken(token);
  return session
    ? {
        ...session,
        token,
        exp,
      }
    : null;
};
