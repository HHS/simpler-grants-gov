import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { getOrganizationRolesHandler } from "./handler";

export const GET = respondWithTraceAndLogs(getOrganizationRolesHandler);
export const POST = respondWithTraceAndLogs(getOrganizationRolesHandler);
