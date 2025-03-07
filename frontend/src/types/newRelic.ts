import * as newrelic from "newrelic";

type NRType = typeof newrelic;

// see https://github.com/newrelic/node-newrelic/blob/40aea36320d15b201800431268be2c3d4c794a7b/api.js#L752
// types library does not expose a type for the options here, so building from scratch
interface typedGetBrowserTimingHeaderOptions {
  nonce?: string;
  hasToRemoveScriptWrapper?: boolean;
  allowTransactionlessInjection?: boolean; // tho jsdoc in nr code types this as "options"
}

export interface NewRelicWithCorrectTypes extends NRType {
  agent: {
    collector: {
      isConnected: () => boolean;
    };
    on: (event: string, callback: (value: unknown) => void) => void;
  };
  getBrowserTimingHeader: (
    options?: typedGetBrowserTimingHeaderOptions,
  ) => string;
}
