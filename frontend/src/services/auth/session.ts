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
import { SimplerJwtPayload, UserSession } from "src/services/auth/types";
import { encodeText } from "src/utils/generalUtils";

// note that cookies will be async in Next 15
import { cookies } from "next/headers";

/*
  All operations that need access to the client and API side session keys are handled
  in this class
*/

export class SessionManager {
  private clientJwtKey: Uint8Array;
  private loginGovJwtKey: KeyObject;

  constructor() {
    this.clientJwtKey = encodeText(environment.SESSION_SECRET);
    this.loginGovJwtKey = createPublicKey(environment.API_JWT_PUBLIC_KEY);
  }

  private async decryptClientToken(
    jwt: string,
  ): Promise<SimplerJwtPayload | null> {
    const payload = await decrypt(
      jwt,
      this.clientJwtKey,
      CLIENT_JWT_ENCRYPTION_ALGORITHM,
    );
    if (!payload || !payload.token) return null;
    return payload as SimplerJwtPayload;
  }

  private async decryptLoginGovToken(jwt: string): Promise<UserSession | null> {
    const payload = await decrypt(
      jwt,
      this.loginGovJwtKey,
      API_JWT_ENCRYPTION_ALGORITHM,
    );
    return (payload as UserSession) ?? null;
  }

  // sets client token on cookie
  async createSession(token: string) {
    const expiresAt = newExpirationDate();
    const session = await encrypt(token, expiresAt, this.clientJwtKey);
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

// instantiating here is messing with testing. Gotta put it somewhere else or be ok with instantiating for each use

// export const sessionManager = new SessionManager();
