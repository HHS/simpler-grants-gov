import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { updateApplicationDetailsHandler } from "./handler";

export const PUT = respondWithTraceAndLogs<{ applicationId: string }>(
  updateApplicationDetailsHandler,
);