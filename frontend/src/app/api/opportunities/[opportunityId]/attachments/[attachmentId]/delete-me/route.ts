import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { newDeleteOpportunityAttachmentHandler } from "./handler";

export const DELETE = respondWithTraceAndLogs<{
  opportunityId: string;
  attachmentId: string;
}>(newDeleteOpportunityAttachmentHandler);
