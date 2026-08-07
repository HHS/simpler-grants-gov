import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { createApplicationAttachmentHandler } from "./handler";

export const POST = respondWithTraceAndLogs<{
  applicationId: string;
}>(createApplicationAttachmentHandler);
