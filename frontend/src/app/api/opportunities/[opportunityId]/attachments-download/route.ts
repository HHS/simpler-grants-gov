import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { getAttachmentsDownload } from "./handler";

export const GET = respondWithTraceAndLogs<{ opportunityId: string }>(
  getAttachmentsDownload,
);
