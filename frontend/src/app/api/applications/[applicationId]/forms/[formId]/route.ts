import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { updateApplicationIncludeFormInSubmissionHandler } from "./handler";

export const PUT = respondWithTraceAndLogs(
  updateApplicationIncludeFormInSubmissionHandler,
);
