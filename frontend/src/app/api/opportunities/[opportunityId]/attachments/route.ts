import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { postOpportunityAttachmentHandler } from "./handler";

export const POST = respondWithTraceAndLogs<{
  opportunityId: string;
}>(postOpportunityAttachmentHandler);
