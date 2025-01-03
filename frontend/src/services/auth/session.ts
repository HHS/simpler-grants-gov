import "server-only";

import { exportJWK, JWK, JWTPayload, jwtVerify, SignJWT } from "jose";
import { environment } from "src/constants/environments";
import { SimplerJwtPayload, UserSession } from "src/services/auth/types";
import { encodeText } from "src/utils/generalUtils";

// note that cookies will be async in Next 15
import { cookies } from "next/headers";

const CLIENT_JWT_ENCRYPTION_ALGORITHM = "HS256";
const API_JWT_ENCRYPTION_ALGORITHM = "RS256";

let sessionManager: SessionManager;

class SessionManager {
  private clientSecret: Uint8Array;
  private loginGovSecret: JWK;

  private constructor(clientSecret: Uint8Array, loginGovSecret: JWK) {
    this.clientSecret = clientSecret;
    this.loginGovSecret = loginGovSecret;
  }

  static async createSessionManager() {
    // const [clientJwk, apiJwk] = await Promise.all([
    //   exportJWK(encodeText(environment.SESSION_SECRET)),
    //   exportJWK(encodeText(environment.API_JWT_PUBLIC_KEY)),
    // ]);
    // return new SessionManager(clientJwk, apiJwk);
    const clientSecret = encodeText(environment.SESSION_SECRET);
    const apiJwk = await exportJWK(encodeText(environment.API_JWT_PUBLIC_KEY));
    return new SessionManager(clientSecret, apiJwk);
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
    if (!payload || !payload.token) return null;
    return payload as UserSession;
  }

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

  async getSession() {
    const cookie = cookies().get("session")?.value;
    if (!cookie) return null;
    const payload = await this.decryptClientToken(cookie);
    if (!payload) {
      return null;
    }
    const { token } = payload;
    const session = await this.decryptLoginGovToken(token);
    return session || null;
  }
}

// returns a new date 1 week from time of function call
export const newExpirationDate = () =>
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

// extracts payload object from jwt string using passed encrytion key
const decrypt = async (
  jwt = "",
  encryptionKey: JWK | Uint8Array,
  algorithm: string,
): Promise<JWTPayload | null> => {
  try {
    const { payload } = await jwtVerify(jwt, encryptionKey, {
      algorithms: [algorithm],
    });
    console.log("!!! session payload", payload);
    return payload;
  } catch (error) {
    console.error("Failed to decrypt session cookie", error);
    return null;
  }
};

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

export async function getSessionManager() {
  if (!sessionManager) {
    sessionManager = await SessionManager.createSessionManager();
  }
  return sessionManager;
}

// const decryptJwtWithKey =
//   <T extends SimplerJwtPayload>(encryptionKey: JWK) =>
//   async (jwt: string): Promise<T | null> => {
//     const payload = await decrypt(jwt, encryptionKey);
//     if (!payload || !payload.token) return null;
//     return payload as T;
//   };

// const decryptWithKey =
//   (encryptionKey: Uint8Array) =>
//   async (sessionCookie = ""): Promise<JWTPayload | null> => {
//     try {
//       const { payload } = await jwtVerify(sessionCookie, encryptionKey, {
//         algorithms: ["HS256"],
//       });
//       console.log("!!! session payload", payload);
//       return payload;
//     } catch (error) {
//       console.error("Failed to decrypt session cookie", error);
//       return null;
//     }
//   };

// export const decryptClientToken = decryptJwtWithKey<SimplerJwtPayload>(
//   encodedClientSessionSecret,
// );

// export const decryptLoginGovToken = decryptJwtWithKey<UserSession>(
//   encodedLoginGovSessionSecret,
// );

// // could try memoizing this function if it is a performance risk
// export const getTokenFromCookie = async (
//   cookie: string,
// ): Promise<UserSession> => {
//   const decryptedSession = await decryptClientToken(cookie);
//   if (!decryptedSession) return null;
//   const token = (decryptedSession.token as string) ?? null;
//   if (!token) return null;
//   return {
//     token,
//   };
// };
