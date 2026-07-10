import { renderHook } from "@testing-library/react";
import { useIsSSR } from "src/hooks/useIsSSR";

/*
  renderHook is too smart for its own good, and does not expose every value output by a hook
  as such, we can't use it out of the box to test this behavior, since we need to capture the value on render
  before the useEffect runs. Using <all> here is a workaround I stole from https://github.com/testing-library/react-testing-library/pull/991
*/
let all: boolean[] = [];
const runHook = () =>
  renderHook(() => {
    const value = useIsSSR();
    all.push(value);
    return value;
  });

describe("usePrevious", () => {
  afterEach(() => {
    all = [];
  });
  it("should return true on initial render", () => {
    runHook();

    expect(all).toEqual([true, false]);
  });

  it("should return false on second render after useEffect has run (non SSR behavior)", () => {
    const { rerender } = runHook();
    expect(all).toEqual([true, false]);
    rerender();
    expect(all).toEqual([true, false, false]);
  });
});
