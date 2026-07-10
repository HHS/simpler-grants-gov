import "server-only";

import { logger } from "src/services/logger/simplerLogger";

import { cookies } from "next/headers";

import { CORRELATION_ID_COOKIE } from "./correlationIdMiddleware";

export const getCorrelationId = async (): Promise<string | undefined> => {
  const cookieStore = await cookies();
  return cookieStore.get(CORRELATION_ID_COOKIE)?.value;
};

export const clearCorrelationId = async (
  message: string = "Clearing correlation id",
) => {
  const cookieStore = await cookies();
  const correlation_id = cookieStore.get(CORRELATION_ID_COOKIE)?.value;
  if (correlation_id !== undefined) {
    cookieStore.delete(CORRELATION_ID_COOKIE);
    logger.info({
      message,
      correlation_id,
      event: "correlation_id_cleared",
    });
  }
};
