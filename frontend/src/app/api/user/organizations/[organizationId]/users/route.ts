import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { getOrganizationUsersHandler } from "./handler";

export const GET = respondWithTraceAndLogs(getOrganizationUsersHandler);

export const POST = respondWithTraceAndLogs(getOrganizationUsersHandler);
