import { clientEnvVars } from "src/constants/environments";

import { NextRequest, NextResponse } from "next/server";

export const CLIENT_ENVIRONMENT_COOKIE_KEY = "_public_env";

export const clientEnvironmentMiddleware = (
  response: NextResponse,
): NextResponse => {
  response.cookies?.set({
    name: CLIENT_ENVIRONMENT_COOKIE_KEY,
    value: JSON.stringify(clientEnvVars),
    // 3 months
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90),
  });

  return response;
};
