import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { listSavedSearches } from "./handler";

// this could be a GET, but eventually we may want to pass pagination info in the body rather than hard coding
export const POST = respondWithTraceAndLogs(listSavedSearches);
