import { deleteSession } from "src/services/auth/sessionUtils";
import {
  clearCorrelationId,
  getCorrelationId,
} from "src/services/correlationId/correlationId";
import { logger } from "src/services/logger/simplerLogger";

import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

// the API reports how its own logout went, 
// the frontend session is cleared
const API_LOGOUT_RESULTS = ["success", "error"];

export async function GET(request: NextRequest) {
  // read before the correlation_id is cleared below
  const correlationId = await getCorrelationId();
  const awsTraceId = request.headers.get("X-Amz-Cf-Id");
  try {
    await deleteSession();

    const apiResult = request.nextUrl.searchParams.get("message");
    logger.info(
      {
        event: "logout",
        correlation_id: correlationId,
        awsTraceId,
        apiResult:
          apiResult && API_LOGOUT_RESULTS.includes(apiResult)
            ? apiResult
            : undefined,
      },
      "Session deleted on logout",
    );

    // Delete correlation_id on explicit logout only. Do not rotate
    // correlation_id if the user is implicitly logged out such as through
    // token expiration.
    await clearCorrelationId("Clearing correlation_id on logout");
  } catch (e) {
    logger.error(
      {
        event: "authentication_request_failed",
        correlation_id: correlationId,
        awsTraceId,
        authRequest: "logout_callback",
        err: e,
      },
      "Error deleting session",
    );
    return redirect("/error");
  }
  return redirect("/logout");
}
