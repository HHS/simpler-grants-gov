import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { deleteAttachmentHandler } from "./handler";

export const DELETE = respondWithTraceAndLogs<{
  applicationId: string;
  applicationAttachmentId: string;
}>(deleteAttachmentHandler);
