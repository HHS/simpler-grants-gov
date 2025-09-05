import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { deleteApiKeyHandler, renameApiKeyHandler } from "./handler";

export const PUT = respondWithTraceAndLogs(renameApiKeyHandler);
export const DELETE = respondWithTraceAndLogs(deleteApiKeyHandler);
