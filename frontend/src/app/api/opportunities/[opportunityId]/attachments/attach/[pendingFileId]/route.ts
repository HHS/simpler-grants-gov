import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { attachOpportunityAttachmentHandler } from "./handler";

export const DELETE = respondWithTraceAndLogs<{
  opportunityId: string;
  pendingFileId: string;
}>(attachOpportunityAttachmentHandler);
