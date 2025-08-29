import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { createApiKeyHandler } from "./handler";

export const POST = respondWithTraceAndLogs(createApiKeyHandler);
