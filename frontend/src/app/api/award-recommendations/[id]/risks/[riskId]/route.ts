import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { deleteRiskForAwardRecommendation } from "./handler";

export const DELETE = respondWithTraceAndLogs(deleteRiskForAwardRecommendation);
