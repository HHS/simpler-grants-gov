import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { getUserSession } from "./handler";

export const revalidate = 0;

export const GET = respondWithTraceAndLogs(getUserSession);
