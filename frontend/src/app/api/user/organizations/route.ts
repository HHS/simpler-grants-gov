import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { getUserOrganizations } from "./handler";

export const GET = respondWithTraceAndLogs(getUserOrganizations);
