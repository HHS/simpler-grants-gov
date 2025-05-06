import { renderHook } from "@testing-library/react";
import { useRouteChange } from "src/hooks/useRouteChange";

let params = "hi";
let pathname = "hello";

jest.mock("next/navigation", () => ({
  useSearchParams: () => params,
  usePathname: () => pathname,
}));

describe("useRouteChange", () => {
  it("calls the passed handler on load", () => {
    const mockHandler = jest.fn();
    renderHook(() => useRouteChange(mockHandler));
    expect(mockHandler).toHaveBeenCalledTimes(1);
  });
  it("calls the passed handler whenenver path changes", () => {
    const mockHandler = jest.fn();
    const { rerender } = renderHook(() => useRouteChange(mockHandler));
    expect(mockHandler).toHaveBeenCalledTimes(1);

    pathname += "hello";
    rerender();

    expect(mockHandler).toHaveBeenCalledTimes(2);
  });
  it("calls the passed handler whenenver query params change", () => {
    const mockHandler = jest.fn();
    const { rerender } = renderHook(() => useRouteChange(mockHandler));
    expect(mockHandler).toHaveBeenCalledTimes(1);

    params += "hi";
    rerender();

    expect(mockHandler).toHaveBeenCalledTimes(2);
  });
});
