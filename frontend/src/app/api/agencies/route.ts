import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { searchAgencies } from "./handler";

export const POST = respondWithTraceAndLogs(searchAgencies);
