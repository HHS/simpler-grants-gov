import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { updateOrganizationInvitation } from "./handler";

export const POST = respondWithTraceAndLogs(updateOrganizationInvitation);
