import { BrowserContext } from "@playwright/test";
import { SignJWT } from "jose";

/*
  most of this is copied from src/services/auth/session in order to keep app logic and test logic separate
*/

const CLIENT_JWT_ENCRYPTION_ALGORITHM = "HS256";

const fakeServerToken = process.env.E2E_USER_AUTH_TOKEN;
const clientSessionSecret = process.env.SESSION_SECRET;

let clientJwtKey: Uint8Array;

const encodeText = (valueToEncode: string) =>
  new TextEncoder().encode(valueToEncode);

export const initializeSessionSecrets = () => {
  if (!clientSessionSecret) {
    // eslint-disable-next-line
    console.debug("Api session key not present, cannot spoof login");
    return;
  }
  // eslint-disable-next-line
  console.debug("Initializing Session Secrets");
  clientJwtKey = encodeText(clientSessionSecret || "");
};

// 5 minute expiration, could probably do less but just in case a test runs really long
export const newExpirationDate = () => new Date(Date.now() + 5 * 60 * 1000);

/*
  encrypts an API token passed as an env var into a fake client token
*/
export const generateSpoofedSession = async (): Promise<string> => {
  if (!clientJwtKey) {
    throw new Error("Unable to spoof login, missing auth key");
  }

  if (!fakeServerToken) {
    throw new Error("Unable to spoof login, missing server token");
  }

  const fakeToken = await new SignJWT({ token: fakeServerToken })
    .setProtectedHeader({ alg: CLIENT_JWT_ENCRYPTION_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(newExpirationDate())
    .sign(clientJwtKey);

  return fakeToken;
};

// sets a spoofed login token on the cookie in order to allow for logging in without
// clicking through the login process
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

// Turning off for now, let's revisit in https://github.com/HHS/simpler-grants-gov/issues/7256
// initializeSessionSecrets();
