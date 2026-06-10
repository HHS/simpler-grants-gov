import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { handleFileUpload } from "./handler";

export const revalidate = 0;

export const GET = respondWithTraceAndLogs(handleFileUpload);
