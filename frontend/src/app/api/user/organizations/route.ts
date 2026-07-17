import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { getUserOrganizationsHandler } from "./handler";

export const GET = respondWithTraceAndLogs(getUserOrganizationsHandler);
