import { BrowserContext } from "@playwright/test";
import { SignJWT } from "jose";
import playwrightEnv from "tests/e2e/playwright-env";

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
  console.debug("Initializing TESTING Session Secrets");
  clientJwtKey = encodeText(playwrightEnv.clientSessionSecret);
};

// 12 hour expiration for test tokens to avoid expiration issues
export const newExpirationDate = () =>
  new Date(Date.now() + 12 * 60 * 60 * 1000);

/*
  encrypts a server session token (fetched from POST /v1/internal/e2e-token)
  into a fake client token
*/
export const generateSpoofedSession = async (
  serverToken: string,
): Promise<string> => {
  if (!clientJwtKey) {
    throw new Error("Unable to spoof login, missing auth key");
  }

  if (!serverToken) {
    throw new Error("Unable to spoof login, missing server token");
  }

  const fakeToken = await new SignJWT({
    token: serverToken,
  })
    .setProtectedHeader({ alg: CLIENT_JWT_ENCRYPTION_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(newExpirationDate())
    .sign(clientJwtKey);

  return fakeToken;
};

// For bypassing login in E2E test runs: encodes the server session token into a
// spoofed client session cookie so tests skip the login process.
export const createSpoofedSessionCookie = async (
  context: BrowserContext,
  serverToken: string,
) => {
  const token = await generateSpoofedSession(serverToken);
  // Mirror the attributes the app sets on the real session cookie
  // (see createSession in src/services/auth/session.ts). In particular:
  //  - sameSite "Lax": addCookies otherwise defaults to SameSite=None, which
  //    Webkit/Firefox reject over plain HTTP.
  //  - expires: without it the cookie is a session cookie, which Webkit will
  //    not replay on the client-side fetch to /api/auth/session, silently
  //    logging the spoofed user out on the client.
  await context.addCookies([
    {
      name: "session",
      value: token,
      url: playwrightEnv.baseUrl,
      httpOnly: true,
      sameSite: "Lax",
      expires: Math.floor(newExpirationDate().getTime() / 1000),
    },
  ]);
};

initializePlaywrightSessionSecrets();
