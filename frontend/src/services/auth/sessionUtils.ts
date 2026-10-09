"server only";

import { KeyObject } from "crypto";
import { JWTPayload, jwtVerify, SignJWT } from "jose";
import { clientTokenExpirationInterval } from "src/constants/auth";
import { environment } from "src/constants/environments";
import { logger } from "src/services/logger/simplerLogger";

import { cookies } from "next/headers";

export const CLIENT_JWT_ENCRYPTION_ALGORITHM = "HS256";
export const API_JWT_ENCRYPTION_ALGORITHM = "RS256";

// returns a new date 15 minutes from time of function call
export const newExpirationDate = () => {
  if (
    environment.AUTH_EXPIRATION_TIME !== "0" &&
    environment.ENVIRONMENT === "local"
  ) {
    return new Date(
      Date.now() + parseInt(environment.AUTH_EXPIRATION_TIME, 10),
    );
  }
  return new Date(Date.now() + clientTokenExpirationInterval);
};

// extracts payload object from jwt string using passed encrytion key and algo
export const decrypt = async (
  jwt = "",
  encryptionKey: KeyObject | Uint8Array,
  algorithm: string,
): Promise<JWTPayload | null> => {
  try {
    const { payload } = await jwtVerify(jwt, encryptionKey, {
      algorithms: [algorithm],
    });
    return payload;
  } catch (e) {
    // jose claim errors carry the decoded payload, which includes the API token
    const { name, code } = e as { name?: string; code?: string };
    logger.warn(
      { algorithm, errorName: name, errorCode: code },
      "Failed to decrypt session cookie",
    );
    return null;
  }
};

// we only encrypt using the client key
export const encrypt = async (
  token: string,
  expiresAt: Date,
  clientJwtKey: Uint8Array,
): Promise<string> => {
  const jwt = await new SignJWT({ token })
    .setProtectedHeader({ alg: CLIENT_JWT_ENCRYPTION_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(expiresAt || "")
    .sign(clientJwtKey);
  return jwt;
};

export async function deleteSession() {
  const cookie = await cookies();
  cookie.delete("session");
}
