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

// ecrypts the api token into client token, then sets client token on cookie
export const createSession = async (token: string, expiration: Date) => {
  if (!clientJwtKey) {
    initializeSessionSecrets();
  }
  const session = await encrypt(token, expiration, clientJwtKey);
  const cookie = await cookies();
  cookie.set("session", session, {
    httpOnly: true,
    secure: environment.ENVIRONMENT === "prod",
    expires: expiration,
    sameSite: "lax",
    path: "/",
  });
};

// returns the necessary user info from decrypted login gov token
// plus the encrypted api token and expiration decrypted from the client token
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
        // expiration timestamp in the login.gov token is in seconds, in order to compare using
        // JS date functions it should be in ms
        expiresAt: exp ? exp * 1000 : undefined,
      }
    : null;
};

// sets a client token based on an API token and expiration, then
// returns the user info as in getSession.
// Similar to running createSession & getSession, but skips unnecessarily decrypting the client token after encrypting
export const createAndReturnSession = async (
  token: string,
  expiration: Date,
) => {
  await createSession(token, expiration);
  const apiSession = await decryptLoginGovToken(token);
  return apiSession
    ? {
        ...apiSession,
        token,
        expiresAt: expiration ? expiration.getTime() : undefined,
      }
    : null;
};

// for use whenever we want to refresh a user's token expiration
// note that the API token itself is not updated other than bumping the expiration
export const refreshSession = async (
  apiSessionToken: string,
): Promise<UserSession | null> => {
  // update expiration on the API side
  await postTokenRefresh({
    additionalHeaders: { "X-SGG-Token": apiSessionToken },
  });
  // re-encrypt the existing API token with a refreshed expiration date
  // and return decrypted user info
  return createAndReturnSession(apiSessionToken, newExpirationDate());
};
