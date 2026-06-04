import "server-only";

import { cookies } from "next/headers";

import { CORRELATION_ID_COOKIE } from "./correlationIdMiddleware";

export const getCorrelationId = async (): Promise<string | undefined> => {
  const cookieStore = await cookies();
  return cookieStore.get(CORRELATION_ID_COOKIE)?.value;
};
