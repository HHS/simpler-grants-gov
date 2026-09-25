import { isValidCorrelationId } from "src/services/correlationId/correlationIdMiddleware";

/**
 * Builds the inline New Relic Browser script for the root layout.
 *
 * The correlation_id custom attribute is set in the same inline script,
 * immediately after the NR loader defines `window.newrelic`. That puts it
 * ahead of the first harvest, so PageView (and every later BrowserInteraction
 * / AjaxRequest on the page) carries it.
 *
 * The id is only inlined if it is a valid UUIDv4, so nothing other than a
 * UUID string can ever be written into the script body.
 */
export const buildNewRelicBrowserScript = (
  browserTimingHeader: string,
  correlationId?: string,
): string => {
  if (!browserTimingHeader) {
    return "";
  }
  if (!correlationId || !isValidCorrelationId(correlationId)) {
    return browserTimingHeader;
  }

  const setCorrelationId = `;if(window.newrelic&&typeof window.newrelic.setCustomAttribute==="function"){window.newrelic.setCustomAttribute("correlation_id",${JSON.stringify(correlationId)});}`;

  return `${browserTimingHeader}${setCorrelationId}`;
};
