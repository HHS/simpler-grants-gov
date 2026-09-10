import { logUserEvent } from "src/services/event/logUserEvent";
import { UserEvent } from "src/types/userEventTypes";

/**
 * This is an endpoint for taking in user events and logging to
 * new relic with a correlation id.
 *
 * Since this is only acting as a fire and forget route, this route is
 * intentionally not wrapped with the respondWithTraceAndLogs similar
 * to other routes.
 */
export const POST = async (request: Request) => {
  try {
    const requestData = (await request.json()) as UserEvent;
    await logUserEvent(requestData);
    return new Response(null, { status: 200 });
  } catch (e) {
    console.error("Error handling user event", e);
    return new Response(null, { status: 400 });
  }
};
