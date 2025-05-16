# Next JS Logging

## Background

The Next JS application logs to std out where messages are picked up by the Fluent Bit sidecar and pushed to both Cloudwatch and New Relic.

## Configuration

Next JS logs use an instance of a Pino logger configured in the [simplerLogger](https://github.com/HHS/simpler-grants-gov/blob/main/frontend/src/services/logger/simplerLogger.tsx). Since Pino can be used in both server and browser contexts this is a good setup for Next JS logging.

All logs should be set up to include an AWS trace id(https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/RequestAndResponseBehaviorCustomOrigin.html) (`X-Amz-Cf-Id` header) whenever possible.

## Requests

Requests log from Next JS middleware. An attempt is made to filter out Next JS page prefetch requests from logging to avoid noise.

Note that since the Next JS middleware uses Vercel's `edge` runtime rather than Node, Pino will use the browser configuration for request logging.

## Responses

Responses will be logged by a wrapper added by convention to API route handlers. The `respondWithTraceAndLogs` wrapper can be found in [apiUtils](https://github.com/HHS/simpler-grants-gov/blob/main/frontend/src/utils/apiUtils.ts)

Since Next JS route files disallow exporting anything other than functions named after the HTTP methods they will be handling, handler logic will be set up in separate files in the same directory. The route file's job will be to wrap the imported handler functions for logging and export them.

When building a route handler, be sure to follow this pattern to ensure responses from the endpoint will logged.

Note that since Next responses that return a page are handled internally to Next, there is no easy way to hook into that process to add logging. We do not expect to see response logs for these requests.

### Example

route.ts

```
import { getHandlerFunction } from "./handler"

export const GET = respondWithTraceAndLogs< your resopnse type >(
  getHandlerFunction
);

```

handler.ts

```

export const handlerFunction = (request, response) => {
	...your handler business logic, returning a response
}

...

```

## Ad hoc logs

We will use Pino for all logs across the application at somet point TBD
