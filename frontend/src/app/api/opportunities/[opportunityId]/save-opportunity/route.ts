import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { addSavedOpportunityForOrganization } from "./handler";

export const PUT = respondWithTraceAndLogs<{ organizationId: string }>(
  addSavedOpportunityForOrganization,
);
