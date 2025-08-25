import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { renameApiKeyHandler } from "./handler";

export const PUT = respondWithTraceAndLogs(renameApiKeyHandler);
