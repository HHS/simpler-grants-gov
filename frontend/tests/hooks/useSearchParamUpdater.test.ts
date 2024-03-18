/* eslint-disable jest/no-commented-out-tests */
import { renderHook, waitFor } from "@testing-library/react";

import { useSearchParamUpdater } from "../../src/hooks/useSearchParamUpdater";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/test") as jest.Mock<string>,
  useSearchParams: jest.fn(
    () => new URLSearchParams(),
  ) as jest.Mock<URLSearchParams>,
}));

const mockPushState = jest.fn();
Object.defineProperty(window, "history", {
  value: {
    pushState: mockPushState,
  },
  writable: true,
});

describe("useSearchParamUpdater", () => {
  beforeEach(() => {
    // Reset the mock state before each test
    mockPushState.mockClear();
    jest.clearAllMocks();
  });

  it("updates a singular param and pushes new path", async () => {
    const { result } = renderHook(() => useSearchParamUpdater());

    result.current.updateQueryParams("testQuery", "query");

    await waitFor(() => {
      expect(mockPushState).toHaveBeenCalledWith(
        {},
        "",
        "/test?query=testQuery",
      );
    });
  });

  it("updates multiple params and pushes new path", async () => {
    const { result } = renderHook(() => useSearchParamUpdater());
    const statuses = new Set(["forecasted", "posted"]);

    result.current.updateQueryParams(statuses, "status");

    await waitFor(() => {
      expect(mockPushState).toHaveBeenCalledWith(
        {},
        "",
        "/test?status=forecasted,posted",
      );
    });
  });

  // TODO: fix clear test

  //   it("clears the status param when no statuses are selected", async () => {
  //     const { result } = renderHook(() => useSearchParamUpdater());
  //     const statuses: Set<string> = new Set();

  //     result.current.updateMultipleParam(statuses, "status");

  //     await waitFor(() => {
  //       expect(mockPushState).toHaveBeenCalledWith({}, "", "/test");
  //     });
  //   });
});
