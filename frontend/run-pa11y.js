const pa11y = require("pa11y");

// const {
//   initalizeSessionSecrets,
//   generateSpoofedSession,
// } = require("tests/e2e/loginUtils");

/* copied from loginUtils */
const { SignJWT } = require("jose");

const CLIENT_JWT_ENCRYPTION_ALGORITHM = "HS256";

const fakeServerToken = process.env.E2E_USER_AUTH_TOKEN;
const clientSessionSecret = process.env.SESSION_SECRET;

let clientJwtKey;

const encodeText = (valueToEncode) => new TextEncoder().encode(valueToEncode);

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
export const generateSpoofedSession = async () => {
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

/* pa11y code */
const defaultOptions = {
  timeout: 120000,
  useIncognitoBrowserContext: false,
  runners: ["axe"],
  chromeLaunchConfig: {
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  },
};

const urls = [
  "http://localhost:3000/api-dashboard",
  "http://localhost:3000/vision",
];

const testPromises = Promise.all(
  urls.map((url) => {
    return generateSpoofedSession().then((token) => {
      const options = {
        ...defaultOptions,
        headers: {
          // Manually set the session cookie so the very first request is authenticated
          Cookie: `session=${token}; Path=/; HttpOnly;`,
        },
      };
      pa11y(url, options);
    });
  }),
);

initalizeSessionSecrets();
Promise.all(testPromises).catch((e) => {
  console.error(e);
});
