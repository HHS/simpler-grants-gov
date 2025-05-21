import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { getSavedOpportunityHandler } from "./handler";

export const GET = respondWithTraceAndLogs<{ id: string }>(
  getSavedOpportunityHandler,
);
