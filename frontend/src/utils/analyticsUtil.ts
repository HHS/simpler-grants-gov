import { validSearchQueryParamKeys } from "src/types/search/searchResponseTypes";

// note that the `newrelic` referenced here is the newrelic object added to window when
// client side new relic scripts are loaded and run, rather than anything explicity imported
type NewRelicBrowser = typeof newrelic;

const NEW_RELIC_POLL_INTERVAL = 2;
const NEW_RELIC_POLL_TIMEOUT = 2000;

// taking less than 2 ms to intantiate locally but not ready on first run
// this will wait until it's present on the window
export const waitForNewRelic = (elapsed = 0) => {
  const present = !!window.newrelic;
  if (elapsed > NEW_RELIC_POLL_TIMEOUT) {
    console.error("New Relic browser code not found");
    return false;
  }
  console.debug("waiting for new relic: ", elapsed);
  if (!present) {
    return setTimeout(
      () => waitForNewRelic(elapsed + NEW_RELIC_POLL_INTERVAL),
      NEW_RELIC_POLL_INTERVAL,
    );
  }
  return true;
};

const getNewRelicBrowserInstance = (): NewRelicBrowser | null => {
  return window && window.newrelic ? window.newrelic : null;
};

export const setNewRelicCustomAttribute = (
  key: string,
  value: string,
): undefined => {
  const newRelic = getNewRelicBrowserInstance();
  if (!newRelic) {
    console.log("--- nr not defined");
    return;
  }
  console.log("--- setting custom attribute", key, value);
  newRelic.setCustomAttribute(key, value);
};

// TODO does setting "" as the value effectively `unset` the attribute?
export const unsetAllNewRelicQueryAttributes = () => {
  validSearchQueryParamKeys.forEach((key) => {
    setNewRelicCustomAttribute(key, "");
  });
};
