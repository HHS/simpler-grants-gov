import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import {
  removeOrganizationUserHandler,
  updateOrganizationUserHandler,
} from "./handler";

export const DELETE = respondWithTraceAndLogs(removeOrganizationUserHandler);

export const PUT = respondWithTraceAndLogs(updateOrganizationUserHandler);
