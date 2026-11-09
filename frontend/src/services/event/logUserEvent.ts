import { getCorrelationId } from "src/services/correlationId/correlationId";
import { logger } from "src/services/logger/simplerLogger";
import { UserEvent } from "src/types/userEventTypes";

// Pino writes these itself, so a client property with the same name would duplicate the key
const PINO_FIELDS = ["level", "msg", "time"];

// properties are spread to the top level so New Relic can query them directly
export const logUserEvent = async (userEvent: UserEvent) => {
  const correlationId = await getCorrelationId();
  const properties = Object.fromEntries(
    Object.entries(userEvent.properties ?? {}).filter(
      ([key]) => !PINO_FIELDS.includes(key),
    ),
  );
  logger.info({
    ...properties,
    correlation_id: correlationId,
    event: userEvent.name,
  });
};
