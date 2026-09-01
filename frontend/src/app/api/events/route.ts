import { logUserEvent } from "src/services/event/logUserEvent";
import { UserEvent } from "src/types/userEventTypes";

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
