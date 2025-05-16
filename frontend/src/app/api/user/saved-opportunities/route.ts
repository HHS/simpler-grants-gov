import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { handleSavedOpportunityRequest } from "./handler";

export const POST = respondWithTraceAndLogs(handleSavedOpportunityRequest);

export const DELETE = respondWithTraceAndLogs(handleSavedOpportunityRequest);
