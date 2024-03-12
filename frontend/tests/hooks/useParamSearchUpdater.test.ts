import { renderHook, waitFor } from "@testing-library/react";

import { useSearchParamUpdater } from "../../src/hooks/useSearchParamUpdater";

// jest.mock("next/router", () => ({
//   useRouter: jest.fn().mockImplementation(() => ({
//     pathname: "/test",
//     query: new URLSearchParams(),
//     push: jest.fn(),
//     replace: jest.fn(),
//   })),
// }));

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
  //   beforeEach(() => {
  //     // Reset the mock state before each test
  //     mockPushState.mockClear();
  //     jest.clearAllMocks(); // If you have other mocks, you might want to clear them as well
  //   });

  it("updates search input param and pushes new path", async () => {
    const { result } = renderHook(() => useSearchParamUpdater());

    result.current.updateSearchInputParam("testQuery");

    await waitFor(() => {
      expect(mockPushState).toHaveBeenCalledWith(
        {},
        "",
        "/test?query=testQuery",
      );
    });
  });

  it("updates status checkbox param and pushes new path", async () => {
    const { result } = renderHook(() => useSearchParamUpdater());

    result.current.updateStatusCheckboxParam("forecasted,posted");

    await waitFor(() => {
      expect(mockPushState).toHaveBeenCalledWith(
        {},
        "",
        "/test?status=forecasted,posted",
      );
    });
  });

  it("Adds status checkboxes then removes them", async () => {
    const { result } = renderHook(() => useSearchParamUpdater());

    result.current.updateStatusCheckboxParam("forecasted,posted");
    result.current.updateStatusCheckboxParam("");

    await waitFor(() => {
      expect(mockPushState).toHaveBeenCalledWith({}, "", "/test");
    });
  });

  it("removes status param when no statuses are selected", async () => {
    const { result } = renderHook(() => useSearchParamUpdater());

    result.current.updateStatusCheckboxParam("");

    await waitFor(() => {
      expect(mockPushState).toHaveBeenCalledWith({}, "", "/test");
    });
  });
});
