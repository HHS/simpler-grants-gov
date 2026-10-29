import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { getUserPrivilegesHandler } from "./handler";

export const POST = respondWithTraceAndLogs(getUserPrivilegesHandler);
