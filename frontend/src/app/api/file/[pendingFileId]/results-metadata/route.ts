import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { getFileResultsMetadata } from "./handler";

export const GET = respondWithTraceAndLogs<{ pendingFileId: string }>(
  getFileResultsMetadata,
);
