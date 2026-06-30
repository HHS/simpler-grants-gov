import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { attachOpportunityAttachmentHandler } from "./handler";

export const POST = respondWithTraceAndLogs<{
  opportunityId: string;
  pendingFileId: string;
}>(attachOpportunityAttachmentHandler);
