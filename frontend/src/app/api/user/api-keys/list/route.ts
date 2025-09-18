import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { listApiKeysHandler } from "./handler";

export const POST = respondWithTraceAndLogs(listApiKeysHandler);
