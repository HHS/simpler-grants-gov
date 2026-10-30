import { createSession } from "src/services/auth/session";
import { newExpirationDate } from "src/services/auth/sessionUtils";
import { getCorrelationId } from "src/services/correlationId/correlationId";
import { logger } from "src/services/logger/simplerLogger";

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

  if (!token) {
    if (pivRequired) {
      return redirect("/login?pivError=true");
    }
    return redirect("/login");
  }
  try {
    await createSession(token, newExpirationDate());
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
    { event: "session_created", correlation_id: correlationId, awsTraceId },
    "Session created",
  );
  return redirect("/login");
}
