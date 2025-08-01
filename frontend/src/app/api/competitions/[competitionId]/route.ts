import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { getCompetition } from "./handler";

export const GET = respondWithTraceAndLogs<{ competitionId: string }>(
  getCompetition,
);
