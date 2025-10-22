import { respondWithTraceAndLogs } from "src/utils/apiUtils";
import { updateOrganizationUserHandler } from "./handler";

export const PUT = respondWithTraceAndLogs(updateOrganizationUserHandler);
