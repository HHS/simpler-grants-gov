import { act, renderHook } from "@testing-library/react";
import { useCopyToClipboard } from "src/hooks/useCopyToClipboard";

const mockWriteText = jest.fn(() => Promise.resolve());

const stubClipboard = (writeText: jest.Mock = mockWriteText) => {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    writable: true,
    configurable: true,
  });
};

const setSecureContext = (value: boolean) => {
  Object.defineProperty(window, "isSecureContext", {
    value,
    writable: true,
    configurable: true,
  });
};

describe("useCopyToClipboard", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    stubClipboard();
    setSecureContext(true);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns idle state on initial render", () => {
    const { result } = renderHook(() => useCopyToClipboard());

    expect(result.current.copied).toBe(false);
    expect(result.current.copying).toBe(false);
    expect(typeof result.current.copyToClipboard).toBe("function");
  });

  it("writes the content to navigator.clipboard and flips copied", async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copyToClipboard("hello");
    });

    expect(mockWriteText).toHaveBeenCalledTimes(1);
    expect(mockWriteText).toHaveBeenCalledWith("hello");
    expect(result.current.copied).toBe(true);
    expect(result.current.copying).toBe(false);
  });

  it("resets copied to false after the default reset duration elapses", async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copyToClipboard("hello");
    });
    expect(result.current.copied).toBe(true);

    act(() => {
      jest.advanceTimersByTime(6000);
    });

    expect(result.current.copied).toBe(false);
  });

  it("honors a custom reset duration", async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copyToClipboard("hello", 1000);
    });
    expect(result.current.copied).toBe(true);

    act(() => {
      jest.advanceTimersByTime(999);
    });
    expect(result.current.copied).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current.copied).toBe(false);
  });

  it("falls back to a temporary textarea + execCommand when clipboard is unavailable", async () => {
    setSecureContext(false);
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      writable: true,
      configurable: true,
    });
    const execCommand = jest.fn().mockReturnValue(true);
    // Saving the reference for restoration; we never invoke it through this binding.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const originalExecCommand = document.execCommand;
    document.execCommand = execCommand as unknown as typeof document.execCommand;

    try {
      const { result } = renderHook(() => useCopyToClipboard());

      await act(async () => {
        await result.current.copyToClipboard("fallback-content");
      });

      expect(execCommand).toHaveBeenCalledWith("copy");
      expect(result.current.copied).toBe(true);
      // The temporary textarea is removed in a `finally` block.
      expect(document.querySelector("textarea")).toBeNull();
    } finally {
      document.execCommand = originalExecCommand;
    }
  });

  it("clears copying and rethrows when the underlying clipboard call fails", async () => {
    const writeText = jest.fn(() => Promise.reject(new Error("denied")));
    stubClipboard(writeText);

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await expect(result.current.copyToClipboard("nope")).rejects.toThrow(
        /Error copying to clipboard/,
      );
    });

    expect(result.current.copying).toBe(false);
    expect(result.current.copied).toBe(false);
  });
});
