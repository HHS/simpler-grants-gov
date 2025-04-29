import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { logoutUser } from "./handler";

export const POST = respondWithTraceAndLogs(logoutUser);
