import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import {
  deleteSearchHandler,
  saveSearchHandler,
  updateSavedSearchHandler,
} from "./handler";

export const POST = respondWithTraceAndLogs(saveSearchHandler);
export const DELETE = respondWithTraceAndLogs(deleteSearchHandler);
export const PUT = respondWithTraceAndLogs(updateSavedSearchHandler);
