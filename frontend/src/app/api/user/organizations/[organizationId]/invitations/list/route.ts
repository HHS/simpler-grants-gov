import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { getOrganizationPendingInvitationsHandler } from "./handler";

export const POST = respondWithTraceAndLogs(
  getOrganizationPendingInvitationsHandler,
);
