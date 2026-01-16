// import initialize playwright session secrets

import { initalizeSessionSecrets } from "tests/e2e/loginUtils";

module.exports = {
  defaults: {
    timeout: 120000,
    runners: ["axe"],
    headers: {
      // Manually set the session cookie so the very first request is authenticated
      Cookie: `session=${process.env.E2E_USER_AUTH_TOKEN}; Path=/; HttpOnly;`,
    },
    chromeLaunchConfig: {
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    },
  },
  urls: [
    {
      url: "http://localhost:3000/api-dashboard?_ff=authOn:true",
      actions: [
        "wait for element main to be visible",
        "screen capture screenshots-output/api-dashboard.png",
      ],
    },
    {
      url: "http://localhost:3000/vision?_ff=authOn:true",
      actions: [
        "wait for element main to be visible",
        "screen capture screenshots-output/vision.png",
      ],
    },
  ],
};
