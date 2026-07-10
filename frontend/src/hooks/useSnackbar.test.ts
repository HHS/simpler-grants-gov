import { act, renderHook } from "@testing-library/react";
import { useSnackbar } from "src/hooks/useSnackbar";

describe("useSnackbar", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("starts with snackbar not visible", () => {
    const { result } = renderHook(() => useSnackbar());
    expect(result.current.snackbarIsVisible).toBe(false);
  });

  it("makes snackbar visible after showSnackbar is called", () => {
    const { result } = renderHook(() => useSnackbar());
    act(() => {
      result.current.showSnackbar();
    });
    expect(result.current.snackbarIsVisible).toBe(true);
  });

  it("hides snackbar after the default timeout", () => {
    const { result } = renderHook(() => useSnackbar());
    act(() => {
      result.current.showSnackbar();
    });
    expect(result.current.snackbarIsVisible).toBe(true);

    act(() => {
      jest.advanceTimersByTime(6000);
    });
    expect(result.current.snackbarIsVisible).toBe(false);
  });

  it("hides snackbar after a custom timeout", () => {
    const { result } = renderHook(() => useSnackbar());
    act(() => {
      result.current.showSnackbar(3000);
    });
    expect(result.current.snackbarIsVisible).toBe(true);

    act(() => {
      jest.advanceTimersByTime(2999);
    });
    expect(result.current.snackbarIsVisible).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current.snackbarIsVisible).toBe(false);
  });

  it("does not auto-hide when visibleTime is 0", () => {
    const { result } = renderHook(() => useSnackbar());
    act(() => {
      result.current.showSnackbar(0);
    });
    expect(result.current.snackbarIsVisible).toBe(true);

    act(() => {
      jest.advanceTimersByTime(60000);
    });
    expect(result.current.snackbarIsVisible).toBe(true);
  });

  it("hides snackbar immediately when hideSnackbar is called", () => {
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

  it("exposes a Snackbar component", () => {
    const { result } = renderHook(() => useSnackbar());
    expect(result.current.Snackbar).toBeDefined();
    expect(typeof result.current.Snackbar).toBe("function");
  });
});
