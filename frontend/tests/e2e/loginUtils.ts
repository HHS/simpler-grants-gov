import { createPrivateKey, createPublicKey, KeyObject } from "crypto";
import { BrowserContext } from "@playwright/test";
import { SignJWT } from "jose";

/*
  most of this is copied from src/services/auth/session in order to keep app logic and test logic separate
*/

const CLIENT_JWT_ENCRYPTION_ALGORITHM = "HS256";
const API_JWT_ENCRYPTION_ALGORITHM = "RS256";

const clientSessionSecret = process.env.SESSION_SECRET;
const apiSessionSecret = process.env.LOGIN_GOV_CLIENT_ASSERTION_PRIVATE_KEY;

let clientJwtKey: Uint8Array;
let loginGovJwtKey: KeyObject;

const encodeText = (valueToEncode: string) =>
  new TextEncoder().encode(valueToEncode);

export const initializeSessionSecrets = () => {
  if (!apiSessionSecret) {
    // eslint-disable-next-line
    console.debug("Api session key not present, cannot spoof login");
    return;
  }
  // eslint-disable-next-line
  console.debug("Initializing Session Secrets");
  clientJwtKey = encodeText(clientSessionSecret || "");
  loginGovJwtKey = createPrivateKey(apiSessionSecret);
};

// 5 minute expiration, could probably do less but just in case a test runs really long
export const newExpirationDate = () => new Date(Date.now() + 5 * 60 * 1000);

// we also need to log the user in on the backend
// we should probably just accomplish that in the seed,
// and if we need to do that in a deployed env at some point we'll cross that bridge then.

export const generateSpoofedSession = async (): Promise<string> => {
  if (!loginGovJwtKey || !clientJwtKey) {
    throw new Error("Unable to spoof login, missing auth key(s)");
  }

  // hardcoding values from API config, or passing in via env
  // (read from override file locally or pass in manually in CI action definition)
  const fakeServerTokenPayload = {
    sub: process.env.E2E_LOGIN_TOKEN_ID, // sub from env var
    aud: "simpler-grants-api",
    iss: "simpler-grants-api",
    email: "fake_mail@mail.com", // this probably needs to sync with the link_external_user table
    user_id: process.env.E2E_USER_ID,
    session_duration_minutes: 30,
  };
  const fakeServerToken = await new SignJWT(fakeServerTokenPayload)
    .setProtectedHeader({ alg: API_JWT_ENCRYPTION_ALGORITHM })
    .setIssuedAt()
    // .setExpirationTime(newExpirationDate())
    .sign(loginGovJwtKey);
  const fakeToken = await new SignJWT({ token: fakeServerToken })
    .setProtectedHeader({ alg: CLIENT_JWT_ENCRYPTION_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(newExpirationDate())
    .sign(clientJwtKey);

  return fakeToken;
};

export const createSpoofedCookie = async (context: BrowserContext) => {
  const token = await generateSpoofedSession();
  await context.addCookies([
    {
      name: "session",
      value: token,
      url: "http://localhost:3000",
    },
  ]);
};

initializeSessionSecrets();
