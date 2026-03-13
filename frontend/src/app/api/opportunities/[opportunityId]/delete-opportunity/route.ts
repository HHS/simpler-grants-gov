import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { deleteSavedOpportunityForOrganizationHandler } from "./handler";

export const DELETE = respondWithTraceAndLogs(deleteSavedOpportunityForOrganizationHandler);
