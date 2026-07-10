import { environment } from "src/constants/environments";
import { validSearchQueryParamKeys } from "src/types/search/searchQueryTypes";

// note that the `newrelic` referenced here is the newrelic object added to window when
// client side new relic scripts are loaded and run, rather than anything explicity imported
export type NewRelicBrowser = {
  setCustomAttribute?: (key: string, value: string | number) => void;
};

const NEW_RELIC_POLL_INTERVAL = 2;
const NEW_RELIC_POLL_TIMEOUT = 500;

// taking less than 2 ms to intantiate locally but not ready on first run
// this will wait until it's present on the window
export const waitForNewRelic = async (): Promise<boolean> => {
  if (environment.NEW_RELIC_ENABLED !== "true") {
    return false;
  }
  let present = !!window.newrelic;
  if (present) {
    return true;
  }

  let elapsed = 0;
  let timedOut = false;

  while (!present && !timedOut) {
    await new Promise((resolve) => {
      setTimeout(() => {
        return resolve(null);
      }, NEW_RELIC_POLL_INTERVAL);
    });
    elapsed += NEW_RELIC_POLL_INTERVAL;
    present = !!window.newrelic;
    if (elapsed >= NEW_RELIC_POLL_TIMEOUT) {
      console.error("Timed out waiting for new relic browser object");
      timedOut = true;
    }
  }
  return present;
};

const getNewRelicBrowserInstance = (): NewRelicBrowser | null => {
  return window?.newrelic ?? null;
};

export const setNewRelicCustomAttribute = (
  key: string,
  value: string | number,
): undefined => {
  const newRelic = getNewRelicBrowserInstance();
  if (!newRelic) {
    console.error("New Relic not defined setting custom attribute");
    return;
  }
  // using underscores since NR has problems with querying fields with dashes
  newRelic.setCustomAttribute!(`search_param_${key}`, value);
};
export const setNewRelicCorrelationIdAttribute = (
  correlationId: string,
): undefined => {
  const newRelic = getNewRelicBrowserInstance();
  if (!newRelic) {
    console.error("New Relic not defined setting correlation_id attribute");
    return;
  }
  newRelic.setCustomAttribute!("correlation_id", correlationId);
};

// TODO does setting "" as the value effectively `unset` the attribute?
export const unsetAllNewRelicQueryAttributes = () => {
  validSearchQueryParamKeys.forEach((key) => {
    setNewRelicCustomAttribute(key, "");
  });
  setNewRelicCustomAttribute("query_length", 0);
};
