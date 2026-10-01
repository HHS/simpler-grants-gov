import { getCorrelationId } from "src/services/correlationId/correlationId";
import { logger } from "src/services/logger/simplerLogger";
import { UserEvent } from "src/types/userEventTypes";

export const logUserEvent = async (userEvent: UserEvent) => {
  const correlationId = await getCorrelationId();
  logger.info({
    correlationId,
    event: userEvent.name,
    properties: userEvent.properties,
  });
};
