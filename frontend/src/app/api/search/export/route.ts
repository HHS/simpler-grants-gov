import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { exportSearchResult } from "./handler";

export const revalidate = 0;

export const GET = respondWithTraceAndLogs(exportSearchResult);
