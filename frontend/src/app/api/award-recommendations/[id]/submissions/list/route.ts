import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { listAwardRecommendationSubmissions } from "./handler";

export const POST = respondWithTraceAndLogs(listAwardRecommendationSubmissions);
