import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { startApplicationHandler } from "./handler";

export const POST = respondWithTraceAndLogs(startApplicationHandler);
