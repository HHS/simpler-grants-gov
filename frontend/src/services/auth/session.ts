import "server-only";

import { createPublicKey, KeyObject } from "crypto";
import { environment } from "src/constants/environments";
import {
  API_JWT_ENCRYPTION_ALGORITHM,
  CLIENT_JWT_ENCRYPTION_ALGORITHM,
  decrypt,
  encrypt,
  newExpirationDate,
} from "src/services/auth/sessionUtils";
import { postTokenRefresh } from "src/services/fetch/fetchers/fetchers";
import { SimplerJwtPayload, UserSession } from "src/types/authTypes";
import { encodeText } from "src/utils/generalUtils";

// note that cookies will be async in Next 15
import { cookies } from "next/headers";

let clientJwtKey: Uint8Array;
let loginGovJwtKey: KeyObject;

// isolate encoding behavior from file execution
const initializeSessionSecrets = () => {
  if (!environment.SESSION_SECRET || !environment.API_JWT_PUBLIC_KEY) {
    // eslint-disable-next-line
    console.debug("Session keys not present");
    return;
  }
  // eslint-disable-next-line
  console.debug("Initializing Session Secrets");
  clientJwtKey = encodeText(environment.SESSION_SECRET);
  loginGovJwtKey = createPublicKey(environment.API_JWT_PUBLIC_KEY);
};

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
  if (!clientJwtKey) {
    initializeSessionSecrets();
  }
  const expiresAt = newExpirationDate();
  const session = await encrypt(token, expiresAt, clientJwtKey);
  const cookie = await cookies();
  cookie.set("session", session, {
    httpOnly: true,
    secure: environment.ENVIRONMENT === "prod",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
};

// returns the necessary user info from decrypted login gov token
// plus api token and expiration
export const getSession = async (): Promise<UserSession | null> => {
  if (!clientJwtKey || !loginGovJwtKey) {
    initializeSessionSecrets();
  }
  const cookie = await cookies();
  const clientSessionToken = cookie.get("session")?.value;
  if (!clientSessionToken) return null;
  const payload = await decryptClientToken(clientSessionToken);
  if (!payload) {
    return null;
  }
  const { token, exp } = payload;
  const session = await decryptLoginGovToken(token);
  return session
    ? {
        ...session,
        token,
        // expiration timestamp in the token is in seconds, in order to compare using
        // JS date functions it should be in ms
        expiresAt: exp ? exp * 1000 : undefined,
      }
    : null;
};

// for use when we want to refresh a user's token expiration
export const refreshSession = async (
  apiSessionToken: string,
): Promise<UserSession | null> => {
  // update expiration on the API
  await postTokenRefresh();
  // re-encrypt the existing API token with a new expiration date
  // or do we want to use a new token that comes down from the postTokenRefresh call?
  await createSession(apiSessionToken);
  // return the new decrypted session
  return getSession();
};
