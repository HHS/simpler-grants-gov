import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { transferOwnershipHandler } from "./handler";

export const PUT = respondWithTraceAndLogs<{
  applicationId: string;
}>(transferOwnershipHandler);
