import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { searchForAgencies } from "./handler";

export const POST = respondWithTraceAndLogs(searchForAgencies);
