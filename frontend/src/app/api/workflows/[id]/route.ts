import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { GET as GetHandler } from "./handler";

export const GET = respondWithTraceAndLogs(GetHandler);
