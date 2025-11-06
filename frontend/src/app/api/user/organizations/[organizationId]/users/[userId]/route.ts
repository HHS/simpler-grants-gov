import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import {
  deleteOrganizationUserHandler,
  updateOrganizationUserHandler,
} from "./handler";

export const DELETE = respondWithTraceAndLogs(deleteOrganizationUserHandler);

export const PUT = respondWithTraceAndLogs(updateOrganizationUserHandler);
