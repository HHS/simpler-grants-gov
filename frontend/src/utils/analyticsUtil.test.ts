import {
  sendNewRelicSearchAttempt,
  setNewRelicCorrelationIdAttribute,
  waitForNewRelic,
  type NewRelicBrowser,
} from "src/utils/analyticsUtil";

// the client bundle has no server env vars, so NEW_RELIC_ENABLED reads as "false" in the browser
jest.mock("src/constants/environments", () => ({
  environment: {
    NEW_RELIC_ENABLED: "false",
  },
}));
declare global {
  interface Window {
    newrelic?: NewRelicBrowser;
  }
}

type WindowWithNewRelic = Window & { newrelic?: NewRelicBrowser };

const deleteNewRelic = () => {
  const win = window as WindowWithNewRelic;
  delete win.newrelic;
};

const setMockNewRelic = (value: NewRelicBrowser) => {
  const win = window as WindowWithNewRelic;
  win.newrelic = value;
};

describe("analyticsUtil", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    // Clean up the mock newrelic object
    if (window.newrelic) {
      deleteNewRelic();
    }
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe("waitForNewRelic", () => {
    it("does not depend on the client side NEW_RELIC_ENABLED value", async () => {
      setMockNewRelic({ addPageAction: jest.fn() });

      await expect(waitForNewRelic()).resolves.toBe(true);
    });

    it("returns true immediately if newrelic is already present", async () => {
      setMockNewRelic({ setCustomAttribute: jest.fn() });

      const result = await waitForNewRelic();
      expect(result).toBe(true);
    });

    it("waits and returns true when newrelic becomes available", async () => {
      jest.useFakeTimers();
      const waitPromise = waitForNewRelic();

      // Simulate newrelic becoming available after a few ticks
      setTimeout(() => {
        setMockNewRelic({ setCustomAttribute: jest.fn() });
      }, 100);

      jest.advanceTimersByTime(100);
      await Promise.resolve();
      await jest.runOnlyPendingTimersAsync();
      const result = await waitPromise;

      expect(result).toBe(true);
    });

    it("returns false and logs error when timeout is reached", async () => {
      jest.useFakeTimers();
      const resultPromise = waitForNewRelic();

      await jest.runAllTimersAsync();
      await Promise.resolve();
      const result = await resultPromise;

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Timed out waiting for new relic browser object",
      );
    });
  });

  describe("setNewRelicCorrelationIdAttribute", () => {
    it("sets correlation_id attribute when newrelic is available", () => {
      const mockSetCustomAttribute = jest.fn();
      setMockNewRelic({ setCustomAttribute: mockSetCustomAttribute });

      const correlationId = "test-correlation-id-123";
      setNewRelicCorrelationIdAttribute(correlationId);

      expect(mockSetCustomAttribute).toHaveBeenCalledWith(
        "correlation_id",
        correlationId,
      );
    });

    it("logs error and returns undefined when newrelic is not available", () => {
      if (window.newrelic) {
        deleteNewRelic();
      }

      const result = setNewRelicCorrelationIdAttribute("test-correlation-id");

      expect(result).toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "New Relic not defined setting correlation_id attribute",
      );
    });
  });

  describe("sendNewRelicSearchAttempt", () => {
    it("sends a search_attempt page action with the passed attributes", () => {
      const mockAddPageAction = jest.fn();
      const mockSetCustomAttribute = jest.fn();
      setMockNewRelic({
        addPageAction: mockAddPageAction,
        setCustomAttribute: mockSetCustomAttribute,
      });

      const attributes = {
        search_param_status: "posted,forecasted",
        search_param_agency: "HHS",
        search_param_page: "1",
        search_param_query_length: 0,
      };
      sendNewRelicSearchAttempt(attributes);

      expect(mockAddPageAction).toHaveBeenCalledTimes(1);
      expect(mockAddPageAction).toHaveBeenCalledWith(
        "search_attempt",
        attributes,
      );
      expect(mockSetCustomAttribute).not.toHaveBeenCalled();
    });

    // TEMPORARY #12725: diagnostics are gated to the sgg2 host
    it("does not log #12725 diagnostics outside sgg2", () => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation();
      setMockNewRelic({ addPageAction: jest.fn() });

      sendNewRelicSearchAttempt({ search_param_page: "1" });

      expect(warnSpy).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it("logs error and returns undefined when newrelic is not available", () => {
      if (window.newrelic) {
        deleteNewRelic();
      }

      const result = sendNewRelicSearchAttempt({ search_param_page: "1" });

      expect(result).toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "New Relic not defined sending search_attempt page action",
      );
    });

    it("does not throw when newrelic does not support addPageAction", () => {
      setMockNewRelic({ setCustomAttribute: jest.fn() });

      expect(() =>
        sendNewRelicSearchAttempt({ search_param_page: "1" }),
      ).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "New Relic not defined sending search_attempt page action",
      );
    });
  });
});
