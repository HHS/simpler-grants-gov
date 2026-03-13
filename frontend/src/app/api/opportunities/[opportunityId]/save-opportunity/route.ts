import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { addSavedOpportunityForOrganizationHandler } from "./handler";

export const PUT = respondWithTraceAndLogs(addSavedOpportunityForOrganizationHandler);
