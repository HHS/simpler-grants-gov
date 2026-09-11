import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { DELETE as DeleteHandler } from "./handler";

export const DELETE = respondWithTraceAndLogs(DeleteHandler);
