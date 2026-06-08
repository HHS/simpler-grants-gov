import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { getSubmissionsForAwardRecommendation } from "./handler";

export const POST = respondWithTraceAndLogs(
  getSubmissionsForAwardRecommendation,
);
