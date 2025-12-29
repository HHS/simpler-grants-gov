// No "use server"
// No newrelic import
// No require()

type BrowserTimingHeaderOptions = {
  hasToRemoveScriptWrapper?: boolean;
  allowTransactionlessInjection?: boolean;
};

type NewRelicAgent = {
  getBrowserTimingHeader: (options: BrowserTimingHeaderOptions) => string;
};

const getNewRelicAgent = (): NewRelicAgent | undefined => {
  const maybeNewRelic = (globalThis as { newrelic?: unknown }).newrelic;
  if (!maybeNewRelic || typeof maybeNewRelic !== "object") return undefined;

  const candidate = maybeNewRelic as Partial<NewRelicAgent>;
  return typeof candidate.getBrowserTimingHeader === "function"
    ? (candidate as NewRelicAgent)
    : undefined;
};

export function getBrowserTimingHeader(): string {
  try {
    // New Relic agent is loaded via NODE_OPTIONS='-r newrelic'
    const nr = getNewRelicAgent();
    if (!nr) return "";

    return nr.getBrowserTimingHeader({
      hasToRemoveScriptWrapper: true,
      allowTransactionlessInjection: true,
    });
  } catch (err) {
    console.warn("New Relic header generation failed:", err);
    return "";
  }
}

export function loadNewRelicBrowserTiming(): string {
  return getBrowserTimingHeader();
}
