import { validSearchQueryParamKeys } from "src/types/search/searchResponseTypes";

// note that the `newrelic` referenced here is the newrelic object added to window when
// client side new relic scripts are loaded and run, rather than anything explicity imported
type NewRelicBrowser = typeof newrelic;

const NEW_RELIC_POLL_INTERVAL = 2;
const NEW_RELIC_POLL_TIMEOUT = 500;

// taking less than 2 ms to intantiate locally but not ready on first run
// this will wait until it's present on the window
export const waitForNewRelic = async (): Promise<boolean> => {
  let present = !!window.newrelic;
  if (present) {
    return true;
  }

  let elapsed = 0;
  let timedOut = false;

  while (!present && !timedOut) {
    elapsed += NEW_RELIC_POLL_INTERVAL;
    await new Promise((resolve) => {
      setTimeout(() => {
        return resolve(null);
      }, elapsed);
    });
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
  value: string,
): undefined => {
  const newRelic = getNewRelicBrowserInstance();
  if (!newRelic) {
    console.error("New Relic not defined setting custom attribute");
    return;
  }
  // using underscores since NR has problems with querying fields with dashes
  newRelic.setCustomAttribute(`search_param_${key}`, value);
};

// TODO does setting "" as the value effectively `unset` the attribute?
export const unsetAllNewRelicQueryAttributes = () => {
  validSearchQueryParamKeys.forEach((key) => {
    setNewRelicCustomAttribute(key, "");
  });
};
