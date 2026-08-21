import { jest } from "@jest/globals";
import { render, waitFor } from "@testing-library/react";

const waitForNewRelicMock = jest.fn(() => Promise.resolve(false));
const setNewRelicCorrelationIdAttributeMock = jest.fn();

jest.mock("src/utils/analyticsUtil", () => ({
  __esModule: true,
  waitForNewRelic: waitForNewRelicMock,
  setNewRelicCorrelationIdAttribute: setNewRelicCorrelationIdAttributeMock,
}));

let CorrelationIdTracker: typeof import("src/components/core/CorrelationIdTracker").CorrelationIdTracker;

const analyticsUtil = {
  waitForNewRelic: waitForNewRelicMock,
  setNewRelicCorrelationIdAttribute: setNewRelicCorrelationIdAttributeMock,
};

beforeAll(async () => {
  const importedModule = await import(
    "src/components/core/CorrelationIdTracker"
  );
  CorrelationIdTracker = importedModule.CorrelationIdTracker;
});

describe("CorrelationIdTracker", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    analyticsUtil.waitForNewRelic.mockResolvedValue(false);
  });

  it("renders without errors and returns null", () => {
    const { container } = render(
      <CorrelationIdTracker correlationId="test-id-123" />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("does not call waitForNewRelic when correlationId is not provided", () => {
    render(<CorrelationIdTracker />);

    expect(analyticsUtil.waitForNewRelic).not.toHaveBeenCalled();
  });

  it("does not call waitForNewRelic when correlationId is empty string", () => {
    render(<CorrelationIdTracker correlationId="" />);

    expect(analyticsUtil.waitForNewRelic).not.toHaveBeenCalled();
  });

  it("waits for newrelic and sets correlation ID when correlationId is provided", async () => {
    analyticsUtil.waitForNewRelic.mockResolvedValue(true);

    render(<CorrelationIdTracker correlationId="test-correlation-id" />);

    await waitFor(() => {
      expect(analyticsUtil.waitForNewRelic).toHaveBeenCalled();
    });

    expect(
      analyticsUtil.setNewRelicCorrelationIdAttribute,
    ).toHaveBeenCalledWith("test-correlation-id");
  });

  it("does not set correlation ID when newrelic is not ready", async () => {
    analyticsUtil.waitForNewRelic.mockResolvedValue(false);

    render(<CorrelationIdTracker correlationId="test-correlation-id" />);

    await waitFor(() => {
      expect(analyticsUtil.waitForNewRelic).toHaveBeenCalled();
    });

    expect(
      analyticsUtil.setNewRelicCorrelationIdAttribute,
    ).not.toHaveBeenCalled();
  });

  it("cancels pending operation on unmount", async () => {
    let resolvePromise: (value: boolean) => void = () => {};

    analyticsUtil.waitForNewRelic.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          resolvePromise = resolve;
        }),
    );

    const { unmount } = render(
      <CorrelationIdTracker correlationId="test-correlation-id" />,
    );

    unmount();
    resolvePromise(true);

    await waitFor(() => {
      expect(
        analyticsUtil.setNewRelicCorrelationIdAttribute,
      ).not.toHaveBeenCalled();
    });
  });

  it("updates correlation ID when correlationId prop changes", async () => {
    analyticsUtil.waitForNewRelic.mockResolvedValue(true);

    const { rerender } = render(
      <CorrelationIdTracker correlationId="correlation-id-1" />,
    );

    await waitFor(() => {
      expect(
        analyticsUtil.setNewRelicCorrelationIdAttribute,
      ).toHaveBeenCalledWith("correlation-id-1");
    });

    expect(
      analyticsUtil.setNewRelicCorrelationIdAttribute,
    ).toHaveBeenCalledTimes(1);

    rerender(<CorrelationIdTracker correlationId="correlation-id-2" />);

    await waitFor(() => {
      expect(
        analyticsUtil.setNewRelicCorrelationIdAttribute,
      ).toHaveBeenCalledWith("correlation-id-2");
    });

    expect(
      analyticsUtil.setNewRelicCorrelationIdAttribute,
    ).toHaveBeenCalledTimes(2);
  });

  it("does not set a new Correlation ID when correlationId becomes empty", async () => {
    analyticsUtil.waitForNewRelic.mockResolvedValue(true);

    const { rerender } = render(
      <CorrelationIdTracker correlationId="correlation-id-1" />,
    );

    await waitFor(() => {
      expect(
        analyticsUtil.setNewRelicCorrelationIdAttribute,
      ).toHaveBeenCalledTimes(1);
    });

    rerender(<CorrelationIdTracker correlationId="" />);

    await waitFor(() => {
      expect(
        analyticsUtil.setNewRelicCorrelationIdAttribute,
      ).toHaveBeenCalledTimes(1);
    });
  });

  it("handles errors from waitForNewRelic gracefully", async () => {
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    analyticsUtil.waitForNewRelic.mockRejectedValue(new Error("Test error"));

    render(<CorrelationIdTracker correlationId="test-correlation-id" />);

    await waitFor(() => {
      expect(analyticsUtil.waitForNewRelic).toHaveBeenCalled();
    });

    expect(
      analyticsUtil.setNewRelicCorrelationIdAttribute,
    ).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
