import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { deleteAwardRecommendationById } from "./handler";

export const DELETE = respondWithTraceAndLogs(deleteAwardRecommendationById);
