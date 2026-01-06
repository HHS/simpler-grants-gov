import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { getUserDetailsHandler } from "./handler";

export const GET = respondWithTraceAndLogs(getUserDetailsHandler);

