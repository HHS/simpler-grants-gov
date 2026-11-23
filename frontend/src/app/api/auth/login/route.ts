import {
  SESSION_DURATION_OVERRIDE_COOKIE,
  SESSION_DURATION_OVERRIDE_COOKIE_MAX_AGE_SECONDS,
  SESSION_DURATION_OVERRIDE_PARAM,
} from "src/constants/auth";
import { environment } from "src/constants/environments";
import { parseSessionDurationOverride } from "src/services/auth/sessionDurationOverride";
import { getCorrelationId } from "src/services/correlationId/correlationId";
import { logger } from "src/services/logger/simplerLogger";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const handleSessionDurationOverride = async (request: NextRequest) => {
  const cookieStore = await cookies();
  if (cookieStore.has(SESSION_DURATION_OVERRIDE_COOKIE)) {
    cookieStore.delete(SESSION_DURATION_OVERRIDE_COOKIE);
  }
  const requestedDuration = request.nextUrl.searchParams.get(
    SESSION_DURATION_OVERRIDE_PARAM,
  );
  if (requestedDuration === null) return;
  const sessionDurationSeconds =
    parseSessionDurationOverride(requestedDuration);
  if (!sessionDurationSeconds) {
    logger.warn(
      {
        event: "session_duration_override_ignored",
        environment: environment.ENVIRONMENT,
      },
      "Session duration override ignored",
    );
    return;
  }
  cookieStore.set(
    SESSION_DURATION_OVERRIDE_COOKIE,
    `${sessionDurationSeconds}`,
    {
      httpOnly: true,
      secure: environment.ENVIRONMENT === "prod",
      maxAge: SESSION_DURATION_OVERRIDE_COOKIE_MAX_AGE_SECONDS,
      sameSite: "lax",
      path: "/",
    },
  );
  logger.info(
    { event: "session_duration_override_requested", sessionDurationSeconds },
    "Session duration override requested",
  );
};

export async function GET(request: NextRequest) {
  if (!environment.AUTH_LOGIN_URL) {
    logger.error(
      {
        event: "authentication_request_failed",
        correlation_id: await getCorrelationId(),
        awsTraceId: request.headers.get("X-Amz-Cf-Id"),
        authRequest: "login",
        reason: "login_url_not_configured",
      },
      "AUTH_LOGIN_URL not defined",
    );
    return new NextResponse("AUTH_LOGIN_URL not defined", { status: 500 });
  }
  await handleSessionDurationOverride(request);
  const pivRequired = request.nextUrl.searchParams.get("piv_required");
  redirect(
    `${environment.AUTH_LOGIN_URL}${pivRequired === "true" ? "?piv_required=True" : ""}`,
  );
}
