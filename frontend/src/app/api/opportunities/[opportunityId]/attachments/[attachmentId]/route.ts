import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { deleteOpportunityAttachmentHandler } from "./handler";

export const DELETE = respondWithTraceAndLogs<{
  opportunityId: string;
  attachmentId: string;
}>(deleteOpportunityAttachmentHandler);
