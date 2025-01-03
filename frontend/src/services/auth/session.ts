import "server-only";

import { createPublicKey, KeyObject } from "crypto";
import { JWTPayload, jwtVerify, SignJWT } from "jose";
import { environment } from "src/constants/environments";
import { SimplerJwtPayload, UserSession } from "src/services/auth/types";
import { encodeText } from "src/utils/generalUtils";

// note that cookies will be async in Next 15
import { cookies } from "next/headers";

const CLIENT_JWT_ENCRYPTION_ALGORITHM = "HS256";
const API_JWT_ENCRYPTION_ALGORITHM = "RS256";

let sessionManager: SessionManager;

/*
  Some session management operations require access to an encoded version of the
  API's public key, which entails async operations. This class includes all functionality
  that depends on that key in order to simplify some timing and organization issues. The
  related operations using the client side key are included as well for ease of use.
*/

class SessionManager {
  private clientSecret: Uint8Array;
  private loginGovSecret: KeyObject;

  private constructor(clientSecret: Uint8Array, loginGovSecret: KeyObject) {
    this.clientSecret = clientSecret;
    this.loginGovSecret = loginGovSecret;
  }

  static async createSessionManager() {
    const clientSecret = encodeText(environment.SESSION_SECRET);
    const apiKeyObject = await createPublicKey(environment.API_JWT_PUBLIC_KEY);
    return new SessionManager(clientSecret, apiKeyObject);
  }

  async decryptClientToken(jwt: string): Promise<SimplerJwtPayload | null> {
    const payload = await decrypt(
      jwt,
      this.clientSecret,
      CLIENT_JWT_ENCRYPTION_ALGORITHM,
    );
    if (!payload || !payload.token) return null;
    return payload as SimplerJwtPayload;
  }

  async decryptLoginGovToken(jwt: string): Promise<UserSession | null> {
    const payload = await decrypt(
      jwt,
      this.loginGovSecret,
      API_JWT_ENCRYPTION_ALGORITHM,
    );
    return (payload as UserSession) ?? null;
  }

  // sets client token on cookie
  async createSession(token: string) {
    const expiresAt = newExpirationDate();
    const session = await encrypt(token, expiresAt, this.clientSecret);
    cookies().set("session", session, {
      httpOnly: true,
      secure: true,
      expires: expiresAt,
      sameSite: "lax",
      path: "/",
    });
  }

  // returns the necessary user info from decrypted login gov token
  // plus client token and expiration
  async getSession(): Promise<UserSession | null> {
    const cookie = cookies().get("session")?.value;
    if (!cookie) return null;
    const payload = await this.decryptClientToken(cookie);
    if (!payload) {
      return null;
    }
    const { token, exp } = payload;
    const session = await this.decryptLoginGovToken(token);
    return session
      ? {
          ...session,
          token,
          exp,
        }
      : null;
  }
}

// returns a new date 1 week from time of function call
export const newExpirationDate = () =>
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

// extracts payload object from jwt string using passed encrytion key and algo
const decrypt = async (
  jwt = "",
  encryptionKey: KeyObject | Uint8Array,
  algorithm: string,
): Promise<JWTPayload | null> => {
  try {
    const { payload } = await jwtVerify(jwt, encryptionKey, {
      algorithms: [algorithm],
    });
    return payload;
  } catch (error) {
    console.error("Failed to decrypt session cookie", error);
    return null;
  }
};

// we only encrypt using the client key
export async function encrypt(
  token: string,
  expiresAt: Date,
  secret: Uint8Array,
): Promise<string> {
  const jwt = await new SignJWT({ token })
    .setProtectedHeader({ alg: CLIENT_JWT_ENCRYPTION_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(expiresAt || "")
    .sign(secret);
  return jwt;
}

// currently unused, will be used in the future for logout
export function deleteSession() {
  cookies().delete("session");
}

// this getter is necessary for dealing with the async operation of encoding
// the API JWT key
export async function getSessionManager() {
  if (!sessionManager) {
    sessionManager = await SessionManager.createSessionManager();
  }
  return sessionManager;
}
