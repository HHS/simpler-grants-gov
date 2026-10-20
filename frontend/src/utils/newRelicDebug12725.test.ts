/**
 * @jest-environment-options {"url": "https://sgg2.teams.simpler.grants.gov/search"}
 */
// TEMPORARY #12725: delete with newRelicDebug12725.ts
import {
  getNrDebug12725Buffer,
  inspectNrDebug12725,
  installNrDebug12725,
  isNrDebug12725Enabled,
  withNrDebug12725,
} from "src/utils/newRelicDebug12725";

type FakeEvent = Record<string, unknown>;
type TestGlobals = {
  NREUM?: unknown;
  newrelic?: unknown;
  __nrDebug12725?: Record<string, () => unknown>;
};

const testWindow = window as unknown as TestGlobals;

const fakeNewRelic = (buffer: FakeEvent[], features: unknown = undefined) => {
  const aggregate = {
    blocked: false,
    drained: true,
    events: { get: () => buffer },
  };
  const triggerHarvestFor = jest.fn(() => ({ ranSend: true }));
  const nr = {
    initializedAgents: {
      abc: {
        agentIdentifier: "abc",
        runtime: { version: "1.324.0", harvester: { triggerHarvestFor } },
        features: features ?? { generic_events: { featAggregate: aggregate } },
      },
    },
    recordCustomEvent: jest.fn(),
  };
  testWindow.NREUM = nr;
  testWindow.newrelic = nr;
  return { nr, aggregate, triggerHarvestFor };
};

describe("newRelicDebug12725", () => {
  let warnSpy: jest.SpyInstance;
  beforeEach(() => {
    warnSpy = jest.spyOn(console, "warn").mockImplementation();
  });
  afterEach(() => {
    delete testWindow.NREUM;
    delete testWindow.newrelic;
    delete testWindow.__nrDebug12725;
    warnSpy.mockRestore();
  });

  it("is enabled on the sgg2 host", () => {
    expect(isNrDebug12725Enabled()).toBe(true);
  });

  it("returns empty diagnostics without newrelic or initializedAgents", () => {
    expect(getNrDebug12725Buffer()).toEqual([]);
    expect(inspectNrDebug12725().agentCount).toBe(0);
    testWindow.NREUM = {};
    expect(getNrDebug12725Buffer()).toEqual([]);
  });

  it("reports a missing generic_events aggregate", () => {
    fakeNewRelic([], {});
    expect(inspectNrDebug12725().agents[0].hasGenericEventsAggregate).toBe(
      false,
    );
    expect(getNrDebug12725Buffer()).toEqual([]);
  });

  it("summarizes the buffer without extra attributes", () => {
    fakeNewRelic([
      {
        eventType: "PageAction",
        actionName: "search_attempt",
        timestamp: 1,
        search_param_query: "secret",
      },
    ]);
    expect(getNrDebug12725Buffer()).toEqual([
      {
        eventType: "PageAction",
        actionName: "search_attempt",
        marker: undefined,
        timestamp: 1,
      },
    ]);
  });

  it("logs whether search_attempt landed in the buffer after addPageAction", () => {
    const buffer: FakeEvent[] = [];
    fakeNewRelic(buffer);
    const addPageAction = jest.fn(() =>
      buffer.push({ eventType: "PageAction", actionName: "search_attempt" }),
    );

    withNrDebug12725({ search_param_page: "1" }, addPageAction);

    expect(addPageAction).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      "[NR #12725]",
      "search_attempt found in generic_events buffer",
      expect.objectContaining({ before: 0, after: 1 }),
    );
  });

  it("still calls addPageAction exactly once when diagnostics throw", () => {
    const nr = {
      get initializedAgents(): never {
        throw new Error("internal shape changed");
      },
    };
    testWindow.NREUM = nr;
    warnSpy.mockImplementation(() => {
      throw new Error("console broken");
    });
    const addPageAction = jest.fn();

    expect(() =>
      withNrDebug12725({ search_param_page: "1" }, addPageAction),
    ).not.toThrow();
    expect(addPageAction).toHaveBeenCalledTimes(1);
  });

  it("installs manual console helpers without harvesting automatically", () => {
    const { nr, triggerHarvestFor } = fakeNewRelic([]);
    installNrDebug12725();
    expect(triggerHarvestFor).not.toHaveBeenCalled();

    testWindow.__nrDebug12725?.sendControlEvent();
    expect(nr.recordCustomEvent).toHaveBeenCalledWith("Sgg2Diagnostic12725", {
      marker: "12725",
    });

    testWindow.__nrDebug12725?.harvest();
    expect(triggerHarvestFor).toHaveBeenCalledTimes(1);
  });
});
