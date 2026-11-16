import { environment } from "src/constants/environments";
import { getSession } from "src/services/auth/session";
import { setLogoutTokenCookie } from "src/services/auth/sessionUtils";
import { getCorrelationId } from "src/services/correlationId/correlationId";
import { logger } from "src/services/logger/simplerLogger";

import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!environment.AUTH_LOGOUT_URL) {
    logger.error(
      {
        event: "authentication_request_failed",
        correlation_id: await getCorrelationId(),
        awsTraceId: request.headers.get("X-Amz-Cf-Id"),
        authRequest: "logout",
        reason: "logout_url_not_configured",
      },
      "AUTH_LOGOUT_URL not defined",
    );
    return new NextResponse("AUTH_LOGOUT_URL not defined", { status: 500 });
  }
  const session = await getSession();
  if (!session?.token) {
    return new NextResponse("user token not present", { status: 500 });
  }
  await setLogoutTokenCookie(session.token);
  return redirect(environment.AUTH_LOGOUT_URL);
}
