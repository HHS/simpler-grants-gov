import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { getRisksForAwardRecommendation } from "./handler";

export const POST = respondWithTraceAndLogs(getRisksForAwardRecommendation);
