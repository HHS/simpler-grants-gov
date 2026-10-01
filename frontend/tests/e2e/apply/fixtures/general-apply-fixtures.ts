import playwrightEnv from "tests/e2e/playwright-env";

export const OPPORTUNITY_ID =
  playwrightEnv.targetEnv !== "local"
    ? "39df8091-6e99-4b0f-9db7-1f3aca9cb6e5"
    : "c3c59562-a54f-4203-b0f6-98f2f0383481";
