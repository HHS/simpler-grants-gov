import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { postAttachmentHandler } from "./handler";

export const POST = respondWithTraceAndLogs<{
  applicationId: string;
}>(postAttachmentHandler);
