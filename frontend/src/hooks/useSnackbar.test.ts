import { act, renderHook } from "@testing-library/react";
import { useSnackbar } from "src/hooks/useSnackbar";

describe("useSnackbar", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it("starts hidden", () => {
    const { result } = renderHook(() => useSnackbar());

    expect(result.current.snackbarIsVisible).toBe(false);
  });

  it("becomes visible when showSnackbar is called", () => {
    const { result } = renderHook(() => useSnackbar());

    act(() => {
      result.current.showSnackbar();
    });

    expect(result.current.snackbarIsVisible).toBe(true);
  });

  it("auto-hides after the default visible time (6000 ms)", () => {
    const { result } = renderHook(() => useSnackbar());

    act(() => {
      result.current.showSnackbar();
    });
    expect(result.current.snackbarIsVisible).toBe(true);

    act(() => {
      jest.advanceTimersByTime(5999);
    });
    expect(result.current.snackbarIsVisible).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current.snackbarIsVisible).toBe(false);
  });

  it("respects a custom visible time", () => {
    const { result } = renderHook(() => useSnackbar());

    act(() => {
      result.current.showSnackbar(2000);
    });
    expect(result.current.snackbarIsVisible).toBe(true);

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(result.current.snackbarIsVisible).toBe(false);
  });

  it("does not schedule auto-hide when visibleTime is zero", () => {
    const { result } = renderHook(() => useSnackbar());

    act(() => {
      result.current.showSnackbar(0);
    });
    expect(result.current.snackbarIsVisible).toBe(true);

    act(() => {
      jest.advanceTimersByTime(60_000);
    });
    expect(result.current.snackbarIsVisible).toBe(true);
  });

  it("hideSnackbar sets visibility to false", () => {
    const { result } = renderHook(() => useSnackbar());

    act(() => {
      result.current.showSnackbar();
    });
    expect(result.current.snackbarIsVisible).toBe(true);

    act(() => {
      result.current.hideSnackbar();
    });
    expect(result.current.snackbarIsVisible).toBe(false);
  });

  it("exposes the Snackbar component on the returned object", () => {
    const { result } = renderHook(() => useSnackbar());

    expect(result.current.Snackbar).toBeDefined();
  });
});
