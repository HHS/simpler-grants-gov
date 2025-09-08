import { createPrivateKey, KeyObject } from "crypto";
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

/*
  - creates a fake login gov / api token
  - encrypts that token into a fake client token

  Note that this relies on E2E_LOGIN_TOKEN_ID and E2E_USER_ID env vars being populated within
  the .env.local file. In CI these will be provided, locally, you may need to look them up in the
  API code or your local db and add them yourself.
*/
export const generateSpoofedSession = async (): Promise<string> => {
  if (!loginGovJwtKey || !clientJwtKey) {
    throw new Error("Unable to spoof login, missing auth key(s)");
  }

  // hardcoded values taken from token config in the API
  const fakeServerTokenPayload = {
    sub: process.env.E2E_LOGIN_TOKEN_ID,
    aud: "simpler-grants-api",
    iss: "simpler-grants-api",
    email: "fake_mail@mail.com",
    user_id: process.env.E2E_USER_ID,
    session_duration_minutes: 30,
  };
  const fakeServerToken = await new SignJWT(fakeServerTokenPayload)
    .setProtectedHeader({ alg: API_JWT_ENCRYPTION_ALGORITHM })
    .setIssuedAt()
    .sign(loginGovJwtKey);

  const fakeToken = await new SignJWT({ token: fakeServerToken })
    .setProtectedHeader({ alg: CLIENT_JWT_ENCRYPTION_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(newExpirationDate())
    .sign(clientJwtKey);

  return fakeToken;
};

export const createSpoofedSessionCookie = async (context: BrowserContext) => {
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
