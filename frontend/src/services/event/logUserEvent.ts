import { getCorrelationId } from "src/services/correlationId/correlationId";
import { logger } from "src/services/logger/simplerLogger";
import { UserEvent } from "src/types/userEventTypes";

// properties are spread to the top level so New Relic can query them directly
export const logUserEvent = async (userEvent: UserEvent) => {
  const correlationId = await getCorrelationId();
  logger.info({
    ...userEvent.properties,
    correlation_id: correlationId,
    event: userEvent.name,
  });
};
