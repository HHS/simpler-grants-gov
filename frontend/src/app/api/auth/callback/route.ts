import { SESSION_DURATION_OVERRIDE_COOKIE } from "src/constants/auth";
import { readError } from "src/errors";
import {
  createSession,
  setApiSessionDuration,
} from "src/services/auth/session";
import { parseSessionDurationOverride } from "src/services/auth/sessionDurationOverride";
import { newExpirationDate } from "src/services/auth/sessionUtils";
import { getCorrelationId } from "src/services/correlationId/correlationId";
import { logger } from "src/services/logger/simplerLogger";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const pivRequired =
    request.nextUrl.searchParams.get("login_piv_required_error") === "true";
  const awsTraceId = request.headers.get("X-Amz-Cf-Id");
  // the correlation_id cookie may not survive the Login.gov round trip
  const correlationId = await getCorrelationId();

  logger.info(
    {
      event: "callback_received",
      correlation_id: correlationId,
      awsTraceId,
      tokenPresent: !!token,
      pivRequiredError: pivRequired,
    },
    "Authentication callback received",
  );

  const cookieStore = await cookies();
  const overrideCookie = cookieStore.get(SESSION_DURATION_OVERRIDE_COOKIE);
  if (overrideCookie) {
    cookieStore.delete(SESSION_DURATION_OVERRIDE_COOKIE);
  }
  let sessionDurationSeconds = parseSessionDurationOverride(
    overrideCookie?.value,
  );

  if (!token) {
    if (pivRequired) {
      return redirect("/login?pivError=true");
    }
    return redirect("/login");
  }
  if (sessionDurationSeconds) {
    try {
      await setApiSessionDuration(token, sessionDurationSeconds);
    } catch (e) {
      logger.warn(
        {
          event: "session_duration_override_failed",
          correlation_id: correlationId,
          status: readError(e as Error, 500).status,
        },
        "Unable to shorten API session, using the default session duration",
      );
      sessionDurationSeconds = undefined;
    }
  }
  try {
    await createSession(
      token,
      newExpirationDate(sessionDurationSeconds),
      sessionDurationSeconds,
    );
  } catch (e) {
    logger.error(
      {
        event: "session_creation_failed",
        correlation_id: correlationId,
        err: e,
        awsTraceId,
      },
      "Error creating session",
    );
    return redirect("/login");
  }
  logger.info(
    {
      event: "session_created",
      correlation_id: correlationId,
      awsTraceId,
      ...(sessionDurationSeconds && { sessionDurationSeconds }),
    },
    "Session created",
  );
  return redirect("/login");
}
