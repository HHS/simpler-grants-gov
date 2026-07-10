import { validSearchQueryParamKeys } from "src/types/search/searchQueryTypes";
import {
  setNewRelicCorrelationIdAttribute,
  setNewRelicCustomAttribute,
  unsetAllNewRelicQueryAttributes,
  waitForNewRelic,
  type NewRelicBrowser,
} from "src/utils/analyticsUtil";

jest.mock("src/constants/environments", () => ({
  environment: {
    NEW_RELIC_ENABLED: "true",
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

  describe("setNewRelicCustomAttribute", () => {
    it("sets a custom attribute when newrelic is available", () => {
      const mockSetCustomAttribute = jest.fn();
      setMockNewRelic({ setCustomAttribute: mockSetCustomAttribute });

      setNewRelicCustomAttribute("test_key", "test_value");

      expect(mockSetCustomAttribute).toHaveBeenCalledWith(
        "search_param_test_key",
        "test_value",
      );
    });

    it("sets a numeric custom attribute when newrelic is available", () => {
      const mockSetCustomAttribute = jest.fn();
      setMockNewRelic({ setCustomAttribute: mockSetCustomAttribute });

      setNewRelicCustomAttribute("test_key", 42);

      expect(mockSetCustomAttribute).toHaveBeenCalledWith(
        "search_param_test_key",
        42,
      );
    });

    it("logs error and returns undefined when newrelic is not available", () => {
      // Ensure newrelic is not defined
      if (window.newrelic) {
        deleteNewRelic();
      }

      const result = setNewRelicCustomAttribute("test_key", "test_value");

      expect(result).toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "New Relic not defined setting custom attribute",
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

  describe("unsetAllNewRelicQueryAttributes", () => {
    it("unsets all query attributes and query_length", () => {
      const mockSetCustomAttribute = jest.fn();
      setMockNewRelic({ setCustomAttribute: mockSetCustomAttribute });

      unsetAllNewRelicQueryAttributes();

      // Should be called once for each valid search query param key + 1 for query_length
      expect(mockSetCustomAttribute).toHaveBeenCalledTimes(
        validSearchQueryParamKeys.length + 1,
      );

      // Verify each search param was called with empty string
      validSearchQueryParamKeys.forEach((key) => {
        expect(mockSetCustomAttribute).toHaveBeenCalledWith(
          `search_param_${key}`,
          "",
        );
      });

      // Verify query_length was called with 0
      expect(mockSetCustomAttribute).toHaveBeenCalledWith(
        "search_param_query_length",
        0,
      );
    });

    it("handles when newrelic is not available", () => {
      if (window.newrelic) {
        deleteNewRelic();
      }

      // Should not throw an error
      expect(() => {
        unsetAllNewRelicQueryAttributes();
      }).not.toThrow();

      // Should log errors for each attempted call
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
