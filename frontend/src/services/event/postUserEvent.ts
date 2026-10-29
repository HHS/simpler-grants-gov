import { UserEvent } from "src/types/userEventTypes";

/**
 * Client-side helper for sending a fire-and-forget interaction event to
 * the `/api/events` route, which attaches the correlation_id server-side
 * and writes the event to the log alongside backend events.
 *
 * Uses `navigator.sendBeacon` (rather than `fetch`) so the event is still
 * delivered even if the click also navigates away from or closes the page.
 */
export const postUserEvent = (userEvent: UserEvent): void => {
  if (typeof navigator === "undefined" || !navigator.sendBeacon) {
    return;
  }

  const blob = new Blob([JSON.stringify(userEvent)], {
    type: "application/json",
  });
  navigator.sendBeacon("/api/events", blob);
};
