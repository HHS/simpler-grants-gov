import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { submitApplicationHandler } from "./handler";

export const POST = respondWithTraceAndLogs<{ applicationId: string }>(
  submitApplicationHandler,
);
