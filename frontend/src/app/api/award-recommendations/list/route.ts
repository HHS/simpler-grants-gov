import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { listAwardRecommendations } from "./handler";

export const POST = respondWithTraceAndLogs(listAwardRecommendations);
