import { respondWithTraceAndLogs } from "src/utils/apiUtils";

import { NextResponse } from "next/server";

export const GET = respondWithTraceAndLogs(() =>
  Promise.resolve(NextResponse.json({})),
);
