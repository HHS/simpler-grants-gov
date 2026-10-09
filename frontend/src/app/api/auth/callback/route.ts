import { createSession } from "src/services/auth/session";
import { newExpirationDate } from "src/services/auth/sessionUtils";
import { logger } from "src/services/logger/simplerLogger";

import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    const pivRequired = request.nextUrl.searchParams.get(
      "login_piv_required_error",
    );
    if (pivRequired === "true") {
      return redirect("/login?pivError=true");
    }
    return redirect("/unauthenticated");
  }
  try {
    await createSession(token, newExpirationDate());
  } catch (e) {
    logger.error(
      { err: e, awsTraceId: request.headers.get("X-Amz-Cf-Id") },
      "Error creating session",
    );
    return redirect("/error");
  }
  return redirect("/login");
}
