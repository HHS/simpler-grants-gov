/*
  Much of this configuration is borrowed from https://github.com/vercel/next.js/discussions/33898#discussioncomment-12402839

  The TLDR is that Next middleware, which we are using for request / response logging is interpreted as running
  in the browser build for some reason. Pino thus needs to run the browser version of itself there. Running a logger
  in Next server contexts will use the other configuration

  Note that logs using the browser and server configurations should be set up to look the same in terms of formatting

*/

import pino from "pino";
import { environment } from "src/constants/environments";
import { resolveExternalRequestUrl } from "src/utils/middlewareSafeUtils";

import { NextRequest, NextResponse } from "next/server";

const levelFormatter = (label: string) => ({ level: label });

const serverNodeRuntimeConfig = {
  formatters: { level: levelFormatter },
  redact: { paths: ["pid", "hostname"], remove: true },
};

const defaultPinoConfig = {
  browser: {
    write: (log: unknown) => {
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(log));
    },
    formatters: { level: levelFormatter },
  },
};

const pinoConfig =
  environment.NEXT_RUNTIME !== "edge"
    ? serverNodeRuntimeConfig
    : defaultPinoConfig;

export const logger = pino(pinoConfig);

// health checks are high volume and low signal. logRequest keeps a 10% sample of them so we
// can still confirm they're running, logResponse drops them entirely to avoid double logging
const isHealthCheck = (url: string | null) =>
  url !== null && url.endsWith("/health");

export const logRequest = (
  request: NextRequest,
  response?: NextResponse,
  correlationId: string | null = null,
) => {
  // note that we can't use lodash in middleware, so some of this is being done extra manually
  const { url, method, headers } = request;

  // disable logging of prefetch requests, see https://github.com/vercel/next.js/discussions/37736#discussioncomment-11985169
  // note that given next internals, this could break. If logs start looking weird, remove this check
  const isPrefetch =
    headers.get("next-url") !== null &&
    headers.get("sec-fetch-mode") === "cors" &&
    headers.get("sec-fetch-dest") === "empty";

  if (!isPrefetch) {
    if (!isHealthCheck(url) || Math.random() * 10 <= 1) {
      logger.info({
        url: resolveExternalRequestUrl(request),
        method,
        userAgent: headers.get("user-agent"),
        acceptLanguage: headers.get("accept-language"),
        awsTraceId: headers.get("X-Amz-Cf-Id"),
        statusCode: response?.status,
        cacheControl: response?.headers?.get("cache-control"),
        hasSessionCookie: request.cookies.get("session") !== undefined,
        correlation_id: correlationId,
      });
    }
  }
};

export const logResponse = (response: Response) => {
  // resonse url is undefined, work around with manually set header
  const { status, headers } = response;
  const url = headers.get("simpler-request-for");

  if (isHealthCheck(url)) {
    return;
  }

  logger.info({
    status,
    url,
    awsTraceId: headers.get("X-Amz-Cf-Id"),
  });
};
