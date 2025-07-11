import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { getApplicationDetailsHandler } from "./handler";

export const GET = respondWithTraceAndLogs<{ applicationId: string }>(
  getApplicationDetailsHandler,
);
