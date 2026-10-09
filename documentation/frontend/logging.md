# Next JS Logging

## Background

Server-side Next JS logs are written as single line JSON to stdout and forwarded to CloudWatch and New Relic:

```text
Next JS (simplerLogger / Pino)
→ stdout / stderr
→ ECS awslogs log driver
→ CloudWatch log group service/<service name>
→ CloudWatch subscription filter → log forwarding Lambda (infra/modules/service/host_log_forwarding.tf)
→ New Relic Logs
```

The forwarding Lambda parses JSON log lines and lifts their top level fields (`level`, `err`, `awsTraceId`, `correlation_id`, etc.) into New Relic log attributes. Plain text output, such as from `console.error`, arrives without a log level, and each line of a multi-line message (such as a stack trace) arrives as a separate log event.

## Configuration

Next JS logs use an instance of a Pino logger configured in the [simplerLogger](https://github.com/HHS/simpler-grants-gov/blob/main/frontend/src/services/logger/simplerLogger.tsx).

The Next JS proxy (`src/proxy.ts`, formerly middleware) and all server code run on the Node runtime, so they use the Node Pino configuration. The logger also contains a browser style configuration for the Edge runtime, which the application does not currently use.

## Server vs browser logging

The conventions in this document apply to server-side code: route handlers, Server Actions, Server Components and server-only services. ESLint disallows direct `console` usage in the main server-side paths (see the `no-console` override in `frontend/eslint.config.mjs`).

Logs from client components and browser hooks only appear in the user's browser console. They do not go through the stdout → New Relic pipeline, so client code continues to use `console.warn` / `console.error` for diagnostics and should not import `simplerLogger`.

## IDs

- `awsTraceId`: the CloudFront request id (`X-Amz-Cf-Id` header). Identifies a single request.
- `correlation_id`: a UUID stored in the `correlation_id` cookie, refreshed on each request for up to a day. Identifies an anonymous browsing session across many requests. It is sent to the API as the `X-Correlation-Id` header.
- `apiRequestId` / `apiGatewayId`: AWS ids returned on API responses (`x-amzn-requestid`, `x-amz-apigw-id`), logged with API request errors.

There is no request scoped logging context, so ad hoc logs only include `awsTraceId` when the code already has the incoming request in scope (for example in route handlers). Request and response logs always include it.

## Requests

Requests log from the Next JS proxy. An attempt is made to filter out Next JS page prefetch requests from logging to avoid noise, and health check requests are sampled.

## Responses

Responses will be logged by a wrapper added by convention to API route handlers. The `respondWithTraceAndLogs` wrapper can be found in [apiUtils](https://github.com/HHS/simpler-grants-gov/blob/main/frontend/src/utils/apiUtils.ts)

Since Next JS route files disallow exporting anything other than functions named after the HTTP methods they will be handling, handler logic will be set up in separate files in the same directory. The route file's job will be to wrap the imported handler functions for logging and export them.

When building a route handler, be sure to follow this pattern to ensure responses from the endpoint will logged.

Note that since Next responses that return a page are handled internally to Next, there is no easy way to hook into that process to add logging. We do not expect to see response logs for these requests.

### Example

route.ts

```typescript
import { getHandlerFunction } from "./handler"

export const GET = respondWithTraceAndLogs< your response type >(
  getHandlerFunction
);

```

handler.ts

```typescript

export const handlerFunction = (request, response) => {
	...your handler business logic, returning a response
}

...

```

## Ad hoc logs

Use the shared logger, passing structured context first and a static message second:

```typescript
import { logger } from "src/services/logger/simplerLogger";

logger.error({ err: e, applicationId }, "Failed to fetch application");
logger.warn({ organizationId }, "Organization has no roles");
logger.info({ event: "thing_happened", opportunityId }, "Thing happened");
```

- Pass caught errors under the `err` key. Pino serializes it with the error type, message and stack, and the logger also includes the error type, status and failing field from the `cause` our custom errors (`src/errors.ts`) carry. Other `cause` data, such as submitted values, is not logged.
- Do not pass the error as a second argument (`logger.error("message", e)`). Pino treats extra arguments as format values and drops the error.
- Do not use other keys for errors (`{ error: e }`). Only `err` is serialized, so the message and stack are lost.
- Include ids that are already in scope and help troubleshooting. Add `awsTraceId: request.headers.get("X-Amz-Cf-Id")` when the request is available.
- Never log auth or session tokens, applicant form contents, or full API request / response bodies. Log status codes and ids instead.
