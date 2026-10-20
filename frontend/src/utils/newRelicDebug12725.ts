// TEMPORARY #12725: diagnostics for New Relic PageAction delivery on sgg2. Delete this file
// and its call sites once #12725 is resolved. Reads undocumented New Relic Browser agent
// v1.324.0 internals, so every access is optional and nothing here may throw.

const PREFIX = "[NR #12725]";
const DEBUG_HOSTNAME = "sgg2.teams.simpler.grants.gov";
const CONTROL_EVENT_TYPE = "Sgg2Diagnostic12725";
const SEARCH_ATTEMPT = "search_attempt";

type DebugBufferedEvent = {
  eventType?: string;
  actionName?: string;
  marker?: string;
  timestamp?: number;
};

type DebugGenericEventsAggregate = {
  blocked?: boolean;
  drained?: boolean;
  events?: { get?: () => DebugBufferedEvent[] };
};

type DebugAgent = {
  agentIdentifier?: string;
  exposed?: boolean;
  info?: { applicationID?: string | number };
  init?: {
    feature_flags?: string[];
    page_action?: { enabled?: boolean };
    generic_events?: { enabled?: boolean };
  };
  runtime?: {
    version?: string;
    loaderType?: string;
    activatedFeatures?: Record<string, unknown>;
    harvester?: {
      triggerHarvestFor?: (aggregate: DebugGenericEventsAggregate) => {
        ranSend?: boolean;
      };
    };
  };
  features?: {
    generic_events?: { featAggregate?: DebugGenericEventsAggregate };
  };
};

type DebugNewRelicGlobal = {
  initializedAgents?: Record<string, DebugAgent>;
  recordCustomEvent?: (
    eventType: string,
    attributes?: Record<string, string>,
  ) => void;
};

type DebugGlobals = {
  NREUM?: DebugNewRelicGlobal;
  newrelic?: DebugNewRelicGlobal;
  __nrDebug12725?: Record<string, () => unknown>;
};

const debugWindow = () => window as unknown as DebugGlobals;

export const isNrDebug12725Enabled = (): boolean =>
  typeof window !== "undefined" && window.location?.hostname === DEBUG_HOSTNAME;

export const nrDebug12725Log = (message: string, data?: unknown) => {
  try {
    console.warn(PREFIX, message, ...(data === undefined ? [] : [data]));
  } catch {
    // never let diagnostics break the page
  }
};

const getAgents = (): DebugAgent[] => {
  try {
    const nr = debugWindow().NREUM ?? debugWindow().newrelic;
    return Object.values(nr?.initializedAgents ?? {});
  } catch {
    return [];
  }
};

const getAggregate = (agent?: DebugAgent) =>
  agent?.features?.generic_events?.featAggregate;

export const getNrDebug12725Buffer = (): DebugBufferedEvent[] => {
  try {
    return getAgents().flatMap((agent) =>
      (getAggregate(agent)?.events?.get?.() ?? []).map(
        ({ eventType, actionName, marker, timestamp }) => ({
          eventType,
          actionName,
          marker,
          timestamp,
        }),
      ),
    );
  } catch {
    return [];
  }
};

export const inspectNrDebug12725 = () => {
  const agents = getAgents();
  const summary = {
    agentCount: agents.length,
    publicNewRelicIsNREUM: debugWindow().newrelic === debugWindow().NREUM,
    agents: agents.map((agent) => {
      const aggregate = getAggregate(agent);
      return {
        agentIdentifier: agent.agentIdentifier,
        exposed: agent.exposed,
        applicationID: agent.info?.applicationID,
        version: agent.runtime?.version,
        loaderType: agent.runtime?.loaderType,
        featureFlags: agent.init?.feature_flags,
        pageActionEnabled: agent.init?.page_action?.enabled,
        genericEventsEnabled: agent.init?.generic_events?.enabled,
        activatedFeatures: agent.runtime?.activatedFeatures,
        hasGenericEventsAggregate: !!aggregate,
        aggregateBlocked: aggregate?.blocked,
        aggregateDrained: aggregate?.drained,
        bufferedEventCount: aggregate?.events?.get?.()?.length,
      };
    }),
  };
  nrDebug12725Log("inspect", summary);
  return summary;
};

const findSearchAttempts = (buffer: DebugBufferedEvent[]) =>
  buffer.filter(
    (event) =>
      event.eventType === "PageAction" && event.actionName === SEARCH_ATTEMPT,
  );

const safely = (step: () => void) => {
  try {
    step();
  } catch (e) {
    nrDebug12725Log("diagnostics failed", e);
  }
};

// wraps the real addPageAction call, which always runs exactly once
export const withNrDebug12725 = (
  attributes: Record<string, string | number>,
  addPageAction: () => void,
) => {
  const enabled = isNrDebug12725Enabled();
  let before = 0;
  if (enabled) {
    safely(() => {
      before = findSearchAttempts(getNrDebug12725Buffer()).length;
      inspectNrDebug12725();
      nrDebug12725Log(`addPageAction("${SEARCH_ATTEMPT}")`, attributes);
    });
  }
  addPageAction();
  if (enabled) {
    safely(() => {
      const after = findSearchAttempts(getNrDebug12725Buffer());
      nrDebug12725Log(
        after.length > before
          ? "search_attempt found in generic_events buffer"
          : "search_attempt NOT found in generic_events buffer after addPageAction (check aggregateDrained / agentCount)",
        { before, after: after.length, latest: after[after.length - 1] },
      );
    });
  }
};

const sendControlEvent = () => {
  const recordCustomEvent = debugWindow().newrelic?.recordCustomEvent;
  if (!recordCustomEvent) {
    nrDebug12725Log("recordCustomEvent not available");
    return;
  }
  recordCustomEvent(CONTROL_EVENT_TYPE, { marker: "12725" });
  nrDebug12725Log(`recordCustomEvent("${CONTROL_EVENT_TYPE}") sent`);
};

// TEMPORARY #12725: internal, manual-only harvest trigger for DevTools use
const harvest = () => {
  const agents = getAgents();
  if (!agents.length) {
    nrDebug12725Log("harvest: no initialized agents found");
    return;
  }
  agents.forEach((agent) => {
    const aggregate = getAggregate(agent);
    const triggerHarvestFor = agent.runtime?.harvester?.triggerHarvestFor;
    if (!aggregate || !triggerHarvestFor) {
      nrDebug12725Log("harvest: aggregate or harvester missing", {
        agentIdentifier: agent.agentIdentifier,
        hasAggregate: !!aggregate,
        hasHarvester: !!triggerHarvestFor,
      });
      return;
    }
    try {
      const result = triggerHarvestFor.call(
        agent.runtime?.harvester,
        aggregate,
      );
      nrDebug12725Log("harvest: triggered, check Network for ins/1", {
        agentIdentifier: agent.agentIdentifier,
        ranSend: result?.ranSend,
      });
    } catch (e) {
      nrDebug12725Log("harvest: failed", e);
    }
  });
};

export const installNrDebug12725 = () => {
  if (!isNrDebug12725Enabled() || debugWindow().__nrDebug12725) {
    return;
  }
  debugWindow().__nrDebug12725 = {
    inspect: inspectNrDebug12725,
    buffer: () => {
      const buffer = getNrDebug12725Buffer();
      nrDebug12725Log("buffer", buffer);
      return buffer;
    },
    sendControlEvent,
    harvest,
  };
  nrDebug12725Log("window.__nrDebug12725 installed");
};
