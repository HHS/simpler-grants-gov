import { BrowserContext } from "@playwright/test";
import { SignJWT } from "jose";

import playwrightEnv from "./playwright-env";

/*

  this file contains functionality for creating client side cookies to spoof a logged in user
  for use in locally running Playwright targeted environments.

  this won't work in any deployed environment

  most of this is copied from src/services/auth/session in order to keep app logic and test logic separate

*/

const CLIENT_JWT_ENCRYPTION_ALGORITHM = "HS256";

let clientJwtKey: Uint8Array;

const encodeText = (valueToEncode: string) =>
  new TextEncoder().encode(valueToEncode);

export const initializePlaywrightSessionSecrets = () => {
  if (!playwrightEnv.clientSessionSecret) {
    // eslint-disable-next-line
    console.debug("Api session key not present, cannot spoof login");
    return;
  }
  // eslint-disable-next-line
  console.debug("Initializing Session Secrets");
  clientJwtKey = encodeText(playwrightEnv.clientSessionSecret || "");
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

  if (!playwrightEnv.fakeServerToken) {
    throw new Error("Unable to spoof login, missing server token");
  }

  const fakeToken = await new SignJWT({ token: playwrightEnv.fakeServerToken })
    .setProtectedHeader({ alg: CLIENT_JWT_ENCRYPTION_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(newExpirationDate())
    .sign(clientJwtKey);

  return fakeToken;
};

// For bypassing login in LOCAL test runs
// sets a spoofed login token on the cookie in order to allow for logging in without
// clicking through the login process
export const createSpoofedSessionCookie = async (context: BrowserContext) => {
  const token = await generateSpoofedSession();
  await context.addCookies([
    {
      name: "session",
      value: token,
      url: playwrightEnv.baseUrl,
    },
  ]);
};

if (playwrightEnv.targetEnv === "local") {
  initializePlaywrightSessionSecrets();
}
