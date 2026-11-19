import { environment } from "src/constants/environments";
import {
  getRefererLoginDestination,
  setLoginRedirectFallback,
} from "src/services/auth/loginRedirectFallback";
import { getCorrelationId } from "src/services/correlationId/correlationId";
import { logger } from "src/services/logger/simplerLogger";

import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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
  // fallback for a "Sign in" click that happened before the client-side
  // sessionStorage save could run (see loginRedirectFallback)
  await setLoginRedirectFallback(getRefererLoginDestination(request));
  const pivRequired = request.nextUrl.searchParams.get("piv_required");
  redirect(
    `${environment.AUTH_LOGIN_URL}${pivRequired === "true" ? "?piv_required=True" : ""}`,
  );
}
