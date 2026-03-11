import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { deleteSavedOpportunityForOrganization } from "./handler";

export const DELETE = respondWithTraceAndLogs<{ opportunityId: string, organizationId: string }>(
  deleteSavedOpportunityForOrganization,
);
