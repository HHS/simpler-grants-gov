/**
 * @file Middleware for issuing and refreshing the anonymous-session
 * correlation_id (CID) cookie.
 *
 * Behavior (see https://github.com/HHS/simpler-grants-gov/issues/8687):
 *   - Read the existing correlation_id cookie.
 *   - If absent or not a valid UUIDv4, create a new one and emit
 *     server-side anonymous_session_started log with the reason.
 *   - Always (re)write the cookie on every request so the TTL slides forward.
 *   - Skip all of the above for health checks (see
 *     https://github.com/HHS/simpler-grants-gov/issues/12076).
 */

import { environment } from "src/constants/environments";
import { logger } from "src/services/logger/simplerLogger";
import { resolveExternalRequestUrl } from "src/utils/middlewareSafeUtils";

import { NextRequest, NextResponse } from "next/server";

export const CORRELATION_ID_COOKIE = "correlation_id";
export const HEALTH_CHECK_PATHNAME = "/api/health";

// Max age is set to 1 day sliding window.
export const CORRELATION_ID_MAX_AGE_SECONDS = 60 * 60 * 24;

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isValidCorrelationId = (value: string): boolean =>
  UUID_V4_REGEX.test(value);

type CreationReason = "missing" | "invalid";

const logAnonymousSessionStarted = (
  correlationId: string,
  reason: CreationReason,
  url: string,
  referer: string | null,
): void => {
  logger.info({
    event: "anonymous_session_started",
    correlation_id: correlationId,
    reason,
    url,
    referer,
  });
};

export const getRequestCorrelationId = (
  request: NextRequest,
  response?: NextResponse,
): string | null =>
  response?.cookies.get(CORRELATION_ID_COOKIE)?.value ??
  request.cookies.get(CORRELATION_ID_COOKIE)?.value ??
  null;

/**
 * Ensure the response carries a valid correlation_id cookie.
 *
 * Always sets the cookie (sliding TTL) logs anonymous_session_started
 * when a new CID is generated. Health checks are exempt entirely.
 */
export const applyCorrelationId = (
  request: NextRequest,
  response: NextResponse,
): NextResponse => {
  if (request.nextUrl.pathname === HEALTH_CHECK_PATHNAME) {
    return response;
  }

  const existing = request.cookies.get(CORRELATION_ID_COOKIE)?.value;

  let correlationId: string;
  if (existing !== undefined && isValidCorrelationId(existing)) {
    correlationId = existing;
  } else {
    correlationId = crypto.randomUUID();
    logAnonymousSessionStarted(
      correlationId,
      existing === undefined ? "missing" : "invalid",
      resolveExternalRequestUrl(request),
      request.headers.get("referer"),
    );
  }

  response.cookies.set({
    name: CORRELATION_ID_COOKIE,
    value: correlationId,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: environment.ENVIRONMENT === "prod",
    maxAge: CORRELATION_ID_MAX_AGE_SECONDS,
  });

  return response;
};
